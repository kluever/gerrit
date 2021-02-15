/**
 * @license
 * Copyright (C) 2018 The Android Open Source Project
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
import {PluginApi} from '../../../api/plugin';
import {ChangeMetadataPluginApi} from '../../../api/change-metadata';
import {HookApi} from '../../../api/hook';

export class GrChangeMetadataApi implements ChangeMetadataPluginApi {
  private _hook: HookApi | null;

  public plugin: PluginApi;

  constructor(plugin: PluginApi) {
    this.plugin = plugin;
    this._hook = null;
  }

  _createHook() {
    this._hook = this.plugin.hook('change-metadata-item');
  }

  onLabelsChanged(callback: (value: unknown) => void) {
    if (!this._hook) {
      this._createHook();
    }
    this._hook!.onAttached((element: Element) =>
      this.plugin.attributeHelper(element).bind('labels', callback)
    );
    return this;
  }
}
