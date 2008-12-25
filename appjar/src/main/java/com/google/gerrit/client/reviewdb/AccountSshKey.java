// Copyright 2008 Google Inc.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

package com.google.gerrit.client.reviewdb;

import com.google.gwtorm.client.Column;
import com.google.gwtorm.client.IntKey;

import java.sql.Timestamp;

/** An SSH key approved for use by an {@link Account}. */
public final class AccountSshKey {
  public static class Id extends IntKey<Account.Id> {
    @Column
    protected Account.Id accountId;

    @Column
    protected int seq;

    protected Id() {
      accountId = new Account.Id();
    }

    public Id(final Account.Id a, final int s) {
      accountId = a;
      seq = s;
    }

    @Override
    public Account.Id getParentKey() {
      return accountId;
    }

    @Override
    public int get() {
      return seq;
    }
  }

  @Column(name = Column.NONE)
  protected AccountSshKey.Id id;

  @Column(length = Integer.MAX_VALUE)
  protected String sshPublicKey;

  @Column
  protected Timestamp storedOn;

  @Column
  protected boolean valid;

  @Column(notNull = false)
  protected Timestamp lastUsedOn;

  protected AccountSshKey() {
  }

  public AccountSshKey(final AccountSshKey.Id i, final String pub) {
    id = i;
    sshPublicKey = pub;
    storedOn = new Timestamp(System.currentTimeMillis());
    valid = true; // We can assume it is fine.
  }

  public AccountSshKey.Id getKey() {
    return id;
  }

  public String getSshPublicKey() {
    return sshPublicKey;
  }

  public String getAlgorithm() {
    final String s = getSshPublicKey();
    if (s == null || s.length() == 0) {
      return "none";
    }

    final String[] parts = s.split(" ");
    if (parts.length < 1) {
      return "none";
    }
    return parts[0];
  }

  public String getEncodedKey() {
    final String s = getSshPublicKey();
    if (s == null || s.length() == 0) {
      return null;
    }

    final String[] parts = s.split(" ");
    if (parts.length < 2) {
      return null;
    }
    return parts[1];
  }

  public String getComment() {
    final String s = getSshPublicKey();
    if (s == null || s.length() == 0) {
      return "";
    }

    final String[] parts = s.split(" ");
    if (parts.length < 3) {
      return "";
    }
    return parts[2];
  }

  public Timestamp getStoredOn() {
    return storedOn;
  }

  public boolean isValid() {
    return valid;
  }

  public void setInvalid() {
    valid = false;
  }

  public Timestamp getLastUsedOn() {
    return lastUsedOn;
  }

  public void setLastUsedOn() {
    lastUsedOn = new Timestamp(System.currentTimeMillis());
  }
}
