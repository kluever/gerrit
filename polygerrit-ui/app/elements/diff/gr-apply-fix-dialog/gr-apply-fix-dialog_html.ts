/**
 * @license
 * Copyright (C) 2020 The Android Open Source Project
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
import {html} from '@polymer/polymer/lib/utils/html-tag';

export const htmlTemplate = html`
  <style include="shared-styles">
    gr-diff {
      --content-width: 90vw;
    }
    .diffContainer {
      padding: var(--spacing-l) 0;
      border-bottom: 1px solid var(--border-color);
    }
    .file-name {
      display: block;
      padding: var(--spacing-s) var(--spacing-l);
      background-color: var(--background-color-secondary);
      border-bottom: 1px solid var(--border-color);
    }
    gr-button {
      margin-left: var(--spacing-m);
    }
    .fix-picker {
      display: flex;
      align-items: center;
      margin-right: var(--spacing-l);
    }
  </style>
  <gr-overlay id="applyFixOverlay" with-backdrop="">
    <gr-dialog
      id="applyFixDialog"
      on-confirm="_handleApplyFix"
      confirm-label="[[_getApplyFixButtonLabel(_isApplyFixLoading)]]"
      disabled="[[_disableApplyFixButton]]"
      confirm-tooltip="[[_computeTooltip(change, _patchNum)]]"
      on-cancel="onCancel"
    >
      <div slot="header">[[_robotId]] - [[getFixDescription(_currentFix)]]</div>
      <div slot="main">
        <template is="dom-repeat" items="[[_currentPreviews]]">
          <div class="file-name">
            <span>[[item.filepath]]</span>
          </div>
          <div class="diffContainer">
            <gr-diff
              prefs="[[overridePartialPrefs(prefs)]]"
              path="[[item.filepath]]"
              diff="[[item.preview]]"
              layers="[[layers]]"
            ></gr-diff>
          </div>
        </template>
      </div>
      <div
        slot="footer"
        class="fix-picker"
        hidden$="[[hasSingleFix(_fixSuggestions)]]"
      >
        <span
          >Suggested fix [[addOneTo(_selectedFixIdx)]] of
          [[_fixSuggestions.length]]</span
        >
        <gr-button
          id="prevFix"
          on-click="_onPrevFixClick"
          disabled$="[[_noPrevFix(_selectedFixIdx)]]"
        >
          <iron-icon icon="gr-icons:chevron-left"></iron-icon>
        </gr-button>
        <gr-button
          id="nextFix"
          on-click="_onNextFixClick"
          disabled$="[[_noNextFix(_selectedFixIdx, _fixSuggestions)]]"
        >
          <iron-icon icon="gr-icons:chevron-right"></iron-icon>
        </gr-button>
      </div>
    </gr-dialog>
  </gr-overlay>
`;
