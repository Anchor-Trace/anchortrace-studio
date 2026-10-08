# SDK pairing

| Studio | SDK | Report / evidence / case schema | Pinned artifact |
|---|---|---|---|
| 0.1.1 | `@anas.abubakar/anchortrace-sdk` 0.1.1, git tag `v0.1.1`, commit `e480415795b907f2cc9408febc98b957bc537c43` | 1 / 1 / 1 | `vendor/anas.abubakar-anchortrace-sdk-0.1.1.tgz` (SHA-256 `ebe3b7702cfb51bbfc63a0521deb4783d0795a077e6704a6688f7d0912c418e4`) |

`pairing.json` is the source of truth. `pnpm run check:pairing` (run by `pnpm build` and CI) fails if the tarball, the installed SDK or the vendored schemas in `vendor/schema/` drift. At run time the page compares the bundled SDK's versions with the pairing and refuses to show results if they differ. There are no sibling-path imports: the repository builds from a clean clone.
