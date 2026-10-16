# Profile and daily study budgets

Jandre's implemented editor saves a trimmed display name and exactly seven integer budgets from 0 to 1440 minutes, including zero, with the fixed Africa/Johannesburg timezone. It uses the shared profile service/context, server confirmation and optimistic revision checks.

Failed saves preserve inputs. Remote edits do not silently replace a dirty form: reload is explicit. UID changes unmount the previous form and suppress its late acknowledgements. Tests cover boundaries, retries, conflicts and account switching.

Dashboard integration remains with Aneesah's module: consume the reactive profile.studyBudgetMinutes from useAuth rather than copying old settings into separate state. Full FR-02 workload-recalculation acceptance remains pending until that view exists. See [handoff](../../../docs/development/ACCOUNTS_HANDOFF.md) and [verification](../../../docs/testing/Jandre_Accounts_Verification_2026-10-16.md).
