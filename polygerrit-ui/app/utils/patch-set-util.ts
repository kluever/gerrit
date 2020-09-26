import {
  RevisionInfo,
  ChangeInfo,
  PatchSetNum,
  EditPatchSetNum,
  BrandType,
} from '../types/common';
import {RestApiService} from '../services/services/gr-rest-api/gr-rest-api';
import {ParsedChangeInfo} from '../elements/shared/gr-rest-api-interface/gr-reviewer-updates-parser';

/**
 * @license
 * Copyright (C) 2016 The Android Open Source Project
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// Tags identifying ChangeMessages that move change into WIP state.
const WIP_TAGS = [
  'autogenerated:gerrit:newWipPatchSet',
  'autogenerated:gerrit:setWorkInProgress',
];

// Tags identifying ChangeMessages that move change out of WIP state.
const READY_TAGS = ['autogenerated:gerrit:setReadyForReview'];

// TODO(TS): Replace usages of these constants by
// EditPatchSetNum and ParentPatchSetNum in common.ts.
export const SPECIAL_PATCH_SET_NUM = {
  EDIT: 'edit',
  PARENT: 'PARENT',
};

export interface PatchSet {
  num: PatchSetNum;
  desc: string | undefined;
  sha: string;
  wip?: boolean;
}

interface RevisionWithSha extends RevisionInfo {
  sha: string;
}

interface PatchRange {
  patchNum?: PatchSetNum;
  basePatchNum?: PatchSetNum;
}

interface PatchRangeRecord {
  base: PatchRange;
}

/**
 * As patchNum can be either a string (e.g. 'edit', 'PARENT') OR a number,
 * this function checks for patchNum equality.
 *
 */
export function patchNumEquals(a?: PatchSetNum, b?: PatchSetNum) {
  if (a === undefined) {
    return a === b;
  }
  // TODO(TS): replace with a===b when the whole code is converted to ts
  return `${a}` === `${b}`;
}

/**
 * Whether the given patch is a numbered parent of a merge (i.e. a negative
 * number).
 */
export function isMergeParent(n: PatchSetNum) {
  return `${n}`[0] === '-';
}

export function isNumber(
  psn: PatchSetNum
): psn is BrandType<number, '_patchSet'> {
  return typeof psn === 'number';
}

/**
 * Given an object of revisions, get a particular revision based on patch
 * num.
 *
 * @return The correspondent revision obj from {revisions}
 */
export function getRevisionByPatchNum(
  revisions: RevisionInfo[],
  patchNum: PatchSetNum
) {
  for (const rev of revisions) {
    if (patchNumEquals(rev._number, patchNum)) {
      return rev;
    }
  }
  console.warn('no revision found');
  return;
}

/**
 * Find change edit base revision if change edit exists.
 *
 * @return change edit parent revision or null if change edit
 *     doesn't exist.
 *
 */
export function findEditParentRevision(revisions: RevisionInfo[]) {
  const editInfo = revisions.find(info => info._number === EditPatchSetNum);

  if (!editInfo) {
    return null;
  }

  return revisions.find(info => info._number === editInfo.basePatchNum) || null;
}

/**
 * Find change edit base patch set number if change edit exists.
 *
 * @return Change edit patch set number or -1.
 *
 */
export function findEditParentPatchNum(revisions: RevisionInfo[]) {
  const revisionInfo = findEditParentRevision(revisions);
  // finding parent of 'edit' patchset, hence revisionInfo._number cannot be
  // 'edit' and must be a number
  // TODO(TS): find a way to avoid 'as'
  return revisionInfo ? (revisionInfo._number as number) : -1;
}

/**
 * Sort given revisions array according to the patch set number, in
 * descending order.
 * The sort algorithm is change edit aware. Change edit has patch set number
 * equals 'edit', but must appear after the patch set it was based on.
 * Example: change edit is based on patch set 2, and another patch set was
 * uploaded after change edit creation, the sorted order should be:
 * 3, edit, 2, 1.
 *
 */
export function sortRevisions<T extends RevisionInfo>(revisions: T[]): T[] {
  const editParent: number = findEditParentPatchNum(revisions);
  // Map a normal patchNum to 2 * (patchNum - 1) + 1... I.e. 1 -> 1,
  // 2 -> 3, 3 -> 5, etc.
  // Map an edit to the patchNum of parent*2... I.e. edit on 2 -> 4.
  // TODO(TS): find a way to avoid 'as'
  const num = (r: T) =>
    r._number === EditPatchSetNum
      ? 2 * editParent
      : 2 * ((r._number as number) - 1) + 1;
  return revisions.sort((a, b) => num(b) - num(a));
}

/**
 * Construct a chronological list of patch sets derived from change details.
 * Each element of this list is an object with the following properties:
 *
 *   * num The number identifying the patch set
 *   * desc Optional patch set description
 *   * wip If true, this patch set was never subject to review.
 *   * sha hash of the commit
 *
 * The wip property is determined by the change's current work_in_progress
 * property and its log of change messages.
 *
 * @return Sorted list of patch set objects, as described
 *     above
 */
export function computeAllPatchSets(
  change: ChangeInfo | ParsedChangeInfo
): PatchSet[] {
  if (!change) {
    return [];
  }

  let patchNums: PatchSet[] = [];
  if (change.revisions && Object.keys(change.revisions).length) {
    const changeRevisions = change.revisions;
    const revisions: RevisionWithSha[] = Object.keys(change.revisions).map(
      sha => {
        return {sha, ...changeRevisions[sha]};
      }
    );
    patchNums = sortRevisions(revisions).map((e: RevisionWithSha) => {
      // TODO(kaspern): Mark which patchset an edit was made on, if an
      // edit exists -- perhaps with a temporary description.
      return {
        num: e._number,
        desc: e.description,
        sha: e.sha,
      };
    });
  }
  return _computeWipForPatchSets(change, patchNums);
}

/**
 * Populate the wip properties of the given list of patch sets.
 *
 * @param change The change details
 * @param patchNums Sorted list of patch set objects, as
 *     generated by computeAllPatchSets
 * @return The given list of patch set objects, with the
 *     wip property set on each of them
 */
function _computeWipForPatchSets(
  change: ChangeInfo | ParsedChangeInfo,
  patchNums: PatchSet[]
) {
  if (!change.messages || !change.messages.length) {
    return patchNums;
  }
  // TODO(TS): replace with Map<PatchNum, boolean>
  const psWip: Map<string, boolean> = new Map();
  let wip = !!change.work_in_progress;
  for (let i = 0; i < change.messages.length; i++) {
    const msg = change.messages[i];
    if (msg.tag && WIP_TAGS.includes(msg.tag)) {
      wip = true;
    } else if (msg.tag && READY_TAGS.includes(msg.tag)) {
      wip = false;
    }
    if (
      msg._revision_number &&
      psWip.get(`${msg._revision_number}`) !== false
    ) {
      psWip.set(`${msg._revision_number}`, wip);
    }
  }

  for (let i = 0; i < patchNums.length; i++) {
    patchNums[i].wip = psWip.get(`${patchNums[i].num}`);
  }
  return patchNums;
}

export const _testOnly_computeWipForPatchSets = _computeWipForPatchSets;

export function computeLatestPatchNum(allPatchSets?: PatchSet[]) {
  if (!allPatchSets || !allPatchSets.length) {
    return undefined;
  }
  if (allPatchSets[0].num === EditPatchSetNum) {
    return allPatchSets[1].num;
  }
  return allPatchSets[0].num;
}

export function hasEditBasedOnCurrentPatchSet(allPatchSets: PatchSet[]) {
  if (!allPatchSets || allPatchSets.length < 2) {
    return false;
  }
  return allPatchSets[0].num === EditPatchSetNum;
}

export function hasEditPatchsetLoaded(patchRangeRecord: PatchRangeRecord) {
  const patchRange = patchRangeRecord.base;
  if (!patchRange) {
    return false;
  }
  return (
    patchRange.patchNum === EditPatchSetNum ||
    patchRange.basePatchNum === EditPatchSetNum
  );
}

/**
 * Check whether there is no newer patch than the latest patch that was
 * available when this change was loaded.
 *
 * @return A promise that yields true if the latest patch
 *     has been loaded, and false if a newer patch has been uploaded in the
 *     meantime. The promise is rejected on network error.
 */
export function fetchChangeUpdates(
  change: ChangeInfo,
  restAPI: RestApiService
) {
  const knownLatest = computeLatestPatchNum(computeAllPatchSets(change));
  return restAPI.getChangeDetail(change._number).then(detail => {
    if (!detail) {
      const error = new Error('Change detail not found.');
      return Promise.reject(error);
    }
    const actualLatest = computeLatestPatchNum(computeAllPatchSets(detail));
    if (!actualLatest || !knownLatest) {
      const error = new Error('Unable to check for latest patchset.');
      return Promise.reject(error);
    }
    return {
      isLatest: actualLatest <= knownLatest,
      newStatus: change.status !== detail.status ? detail.status : null,
      newMessages:
        (change.messages || []).length < (detail.messages || []).length,
    };
  });
}

/**
 * @param revisions A sorted array of revisions.
 *
 * @return the index of the revision with the given patchNum.
 */
export function findSortedIndex(
  patchNum: PatchSetNum,
  revisions: RevisionInfo[]
) {
  revisions = revisions || [];
  const findNum = (rev: RevisionInfo) => `${rev._number}` === `${patchNum}`;
  return revisions.findIndex(findNum);
}

/**
 * Convert parent indexes from patch range expressions to numbers.
 * For example, in a patch range expression `"-3"` becomes `3`.
 *
 */

export function getParentIndex(rangeBase: PatchSetNum) {
  return -parseInt(`${rangeBase}`, 10);
}
