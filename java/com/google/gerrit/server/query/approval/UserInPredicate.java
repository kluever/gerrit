package com.google.gerrit.server.query.approval;

import com.google.gerrit.entities.Account;
import com.google.gerrit.entities.AccountGroup;
import com.google.gerrit.entities.PatchSet;
import com.google.gerrit.index.query.Predicate;
import com.google.gerrit.server.IdentifiedUser;
import com.google.inject.Inject;
import com.google.inject.assistedinject.Assisted;
import java.util.Collection;
import java.util.Objects;

/** Predicate that matches group memberships of users such as uploader or approver. */
public class UserInPredicate extends ApprovalPredicate {
  interface Factory {
    UserInPredicate create(Field field, AccountGroup.UUID group);
  }

  enum Field {
    UPLOADER,
    APPROVER
  }

  private final IdentifiedUser.GenericFactory identifiedUserFactory;
  private final Field field;
  private final AccountGroup.UUID group;

  @Inject
  UserInPredicate(
      IdentifiedUser.GenericFactory identifiedUserFactory,
      @Assisted Field field,
      @Assisted AccountGroup.UUID group) {
    this.identifiedUserFactory = identifiedUserFactory;
    this.field = field;
    this.group = group;
  }

  @Override
  public boolean match(ApprovalContext ctx) {
    Account.Id accountId;
    if (field == Field.UPLOADER) {
      PatchSet patchSet = ctx.target();
      accountId = patchSet.uploader();
    } else if (field == Field.APPROVER) {
      accountId = ctx.patchSetApproval().accountId();
    } else {
      throw new IllegalStateException("unknown field in group membership check: " + field);
    }
    return identifiedUserFactory.create(accountId).getEffectiveGroups().contains(group);
  }

  @Override
  public Predicate<ApprovalContext> copy(
      Collection<? extends Predicate<ApprovalContext>> children) {
    return new UserInPredicate(identifiedUserFactory, field, group);
  }

  @Override
  public int hashCode() {
    return Objects.hash(field, group);
  }

  @Override
  public boolean equals(Object other) {
    if (!(other instanceof UserInPredicate)) {
      return false;
    }
    UserInPredicate o = (UserInPredicate) other;
    return Objects.equals(o.field, field) && Objects.equals(o.group, group);
  }
}
