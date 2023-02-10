/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import { Connection, SfError } from '@salesforce/core';
import { Ux } from '@salesforce/sf-plugins-core';
import { Case, ChangeCaseApiResponse, CreateCaseResponse, Implementation } from './types';

const retrieveOrCreateBuildId = async (conn: Connection, ux: Ux, release: string): Promise<string> => {
  const buildResults = await conn.query<{ Id: string }>(`SELECT Id FROM ADM_Build__c WHERE Name = '${release}'`);
  const records = buildResults.records;

  if (records.length >= 1) {
    if (records.length > 1) {
      ux.warn(`More than one ${release} build found. Using the first one.`);
    }
    return records[0].Id;
  } else {
    const buildCreateResult = await conn.sobject('ADM_Build__c').create({ Name: release });

    // Only this style of check resolves the createResult.errors check
    if (buildCreateResult.success === false) {
      throw new SfError(`Creating build failed with ${buildCreateResult.errors.join(',')}`);
    }
    return buildCreateResult.id;
  }
};

export const retrieveOrCreateReleaseId = async (conn: Connection, ux: Ux, release: string): Promise<string> => {
  const releaseResults = await conn.query<{ Id: string }>(`SELECT Id FROM ADM_Release__c WHERE Name = '${release}'`);
  const records = releaseResults.records;

  if (records.length >= 1) {
    if (records.length > 1) {
      ux.warn(`More than one ${release} release found. Using the first one.`);
    }
    return records[0].Id;
  } else {
    const releaseRecord = {
      Name: release,
      Build__c: await retrieveOrCreateBuildId(conn, ux, release),
    };

    const releaseCreateResult = await conn.sobject('ADM_Release__c').create(releaseRecord);
    if (releaseCreateResult.success) {
      return releaseCreateResult.id;
    }

    // Only this style of check resolves the createResult.errors check
    if (releaseCreateResult.success === false) {
      throw new SfError(`Creating release failed with ${releaseCreateResult.errors.join(',')}`);
    }
  }
  throw new SfError('Creating release failed with unknown error');
};

const retrieveCasesFromRelease = async (conn: Connection, ux: Ux, release: string, location: string): Promise<Case[]> =>
  (
    await conn.query<Case>(
      'SELECT Id, Status, SM_ChangeType__c, SM_Implementation_Plan__c FROM Case WHERE ' +
        `SM_Release__c = '${await retrieveOrCreateReleaseId(conn, ux, release)}' AND ` +
        `SM_Source_Control_Location__c = '${location}'`
    )
  ).records;

export const retrieveImplementationFromCase = async (conn: Connection, caseId: string): Promise<Implementation[]> =>
  (await conn.query<Implementation>(`SELECT Id FROM SM_Change_Implementation__c WHERE Case__c = '${caseId}'`)).records;

type caseRetrieveInput = {
  conn: Connection;
  ux: Ux;
} & (
  | { changeCaseId: string; release?: never; location?: never }
  | { release: string; location: string; changeCaseId?: never }
);

export const retrieveCaseFromIdOrRelease = async ({
  conn,
  ux,
  changeCaseId,
  release,
  location,
}: caseRetrieveInput): Promise<Case> => {
  const CASE = conn.sobject<'Case'>('Case');

  if (changeCaseId) {
    ux.log(`Using change case ID: ${changeCaseId}.`);
    return CASE.retrieve(changeCaseId) as Promise<Case>;
  } else {
    if (!release || !location) {
      throw new SfError('Either the change case ID OR the release AND location need to be provided.');
    }
    ux.log('No change case ID provided, using release and location instead.');

    const cases = (await retrieveCasesFromRelease(conn, ux, release, location)).filter(
      (item) => !item.Status.includes('Closed')
    );

    if (cases.length === 0) {
      throw new SfError(`Could not find change case with ${release} and ${location} and non-Closed status.`);
    }
    if (cases.length > 1) {
      throw new SfError(
        `Found more then one change case with ${release} and ${location} and non-Closed status. Use the change case ID to remove ambiguity`
      );
    }
    return cases[0];
  }
};

export const parseErrors = (body: ChangeCaseApiResponse | CreateCaseResponse): string => {
  if (body.errors) {
    return body.errors.map((error) => error.message).join(',');
  }
  if (body.results?.length && typeof body.results[0].message === 'string') {
    return body.results[0].message;
  } else {
    throw new SfError('Unexpected error response from change case API');
  }
};
