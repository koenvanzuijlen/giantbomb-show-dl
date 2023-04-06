# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

## [2.0.0](https://github.com/koenvanzuijlen/giantbomb-show-dl/compare/v1.10.1...v2.0.0) (2023-04-06)


### ⚠ BREAKING CHANGES

* dropped support for Node.js version lower than 18

### Features

* add axios client for API calls ([01a2f65](https://github.com/koenvanzuijlen/giantbomb-show-dl/commit/01a2f652a880a09d11c84a77789bef47d4bf57bd))
* add disabled fetch client for API calls ([c0167e0](https://github.com/koenvanzuijlen/giantbomb-show-dl/commit/c0167e0e6681ec3ee3ace768444d71aa57da1180))


### Build System

* dropped support for Node.js version lower than 18 ([0c402dd](https://github.com/koenvanzuijlen/giantbomb-show-dl/commit/0c402ddc31ead5118e17ac1e695bf212fe42b02f))

### [1.10.1](https://github.com/koenvanzuijlen/giantbomb-show-dl/compare/v1.10.0...v1.10.1) (2023-03-22)


### Bug Fixes

* don't create subdir & metadata when already downloaded ([e240ea7](https://github.com/koenvanzuijlen/giantbomb-show-dl/commit/e240ea7907f2c5d417e3e226a4a750f40d8548e4))

## [1.10.0](https://github.com/koenvanzuijlen/giantbomb-show-dl/compare/v1.9.1...v1.10.0) (2023-03-03)


### Features

* add --archive option to download all videos ([e15b746](https://github.com/koenvanzuijlen/giantbomb-show-dl/commit/e15b74625249f474cd26aa5e92447005833b3df8))
* improve readability of download tracking file: ([8f8e10b](https://github.com/koenvanzuijlen/giantbomb-show-dl/commit/8f8e10b65cad3e76828ecdadf3afd993aba0ae42))

### [1.9.1](https://github.com/koenvanzuijlen/giantbomb-show-dl/compare/v1.9.0...v1.9.1) (2023-01-31)


### Bug Fixes

* set typescript compiler module to ES2020 ([#17](https://github.com/koenvanzuijlen/giantbomb-show-dl/issues/17)) ([6021534](https://github.com/koenvanzuijlen/giantbomb-show-dl/commit/60215347406ae2fcabb5858a6eebbd00802f30f5))

## [1.9.0](https://github.com/koenvanzuijlen/giantbomb-show-dl/compare/v1.8.0...v1.9.0) (2023-01-30)


### Features

* improve output readability ([50df863](https://github.com/koenvanzuijlen/giantbomb-show-dl/commit/50df8632275d1d35d02e41d83e7389d4b1fe7249))


### Bug Fixes

* 8k bitrate check works for newer videos ([#16](https://github.com/koenvanzuijlen/giantbomb-show-dl/issues/16)) ([8bc28bb](https://github.com/koenvanzuijlen/giantbomb-show-dl/commit/8bc28bbe9022ae3e043649d3ef034d8b942c983b))

## [1.8.0](https://github.com/koenvanzuijlen/giantbomb-show-dl/compare/v1.7.1...v1.8.0) (2022-07-08)


### Features

* add --mp3tag option ([f080d22](https://github.com/koenvanzuijlen/giantbomb-show-dl/commit/f080d222d17fceebd30a5dbd027f24c7629146d0))
* download both show image and logo ([a55f74a](https://github.com/koenvanzuijlen/giantbomb-show-dl/commit/a55f74abb3167e1809c2146add171e92cc0aceef))
* save show metadata ([a55a8ba](https://github.com/koenvanzuijlen/giantbomb-show-dl/commit/a55a8baf5a2d723c4cef6376c01303baadca28e1))
* save video image and metadata ([7539391](https://github.com/koenvanzuijlen/giantbomb-show-dl/commit/753939154bc1ea7c3938e774b02ca5abc3ab0c86))


### Bug Fixes

* average download speed for small files was incorrect ([e9c8dbb](https://github.com/koenvanzuijlen/giantbomb-show-dl/commit/e9c8dbb2d318874760f9bb4223524ee7b8273ce2))
* show filename instead of path ([4a4a79e](https://github.com/koenvanzuijlen/giantbomb-show-dl/commit/4a4a79eb8fdc4cabb200a869c486f1482ce60660))

### [1.7.1](https://github.com/koenvanzuijlen/giantbomb-show-dl/compare/v1.7.0...v1.7.1) (2022-06-25)


### Bug Fixes

* do not keep entire history in memory ([749e5ff](https://github.com/koenvanzuijlen/giantbomb-show-dl/commit/749e5ffb5ed2d32e03fb44f7d15db929e55d830e))

## [1.7.0](https://github.com/koenvanzuijlen/giantbomb-show-dl/compare/v1.6.0...v1.7.0) (2022-06-24)


### Features

* add --video_id option to download non-show videos ([1a66e40](https://github.com/koenvanzuijlen/giantbomb-show-dl/commit/1a66e4058032b9d817693a9b7d9ffaff6b0455c9))
* show download speed and time ([2e3ac96](https://github.com/koenvanzuijlen/giantbomb-show-dl/commit/2e3ac960065527bfb02c4d892a11c978c1e0aea9))

## [1.6.0](https://github.com/koenvanzuijlen/giantbomb-show-dl/compare/v1.5.0...v1.6.0) (2022-06-14)


### Features

* add debug option ([03d9570](https://github.com/koenvanzuijlen/giantbomb-show-dl/commit/03d957092abc77899f7179389269efca85101a4c))


### Bug Fixes

* add timeout to prevent hanging requests ([3b26554](https://github.com/koenvanzuijlen/giantbomb-show-dl/commit/3b26554f51b7521e1f55e51991ca466968ee87c7))
* make highest url check more robust ([f0b601f](https://github.com/koenvanzuijlen/giantbomb-show-dl/commit/f0b601f5579f119e4e8a05ffa35c15e309534312))

## [1.5.0](https://github.com/koenvanzuijlen/giantbomb-show-dl/compare/v1.4.1...v1.5.0) (2022-06-08)


### Features

* show download sizes in readable format ([7bc9796](https://github.com/koenvanzuijlen/giantbomb-show-dl/commit/7bc9796abe753ea12582dc48a88c1946e1059ad0))

### [1.4.1](https://github.com/koenvanzuijlen/giantbomb-show-dl/compare/v1.4.0...v1.4.1) (2022-05-19)


### Bug Fixes

* upgrade dependencies ([1011d9a](https://github.com/koenvanzuijlen/giantbomb-show-dl/commit/1011d9a7868349835720e8dcb75ae0f1cb8eada0))

## [1.4.0](https://github.com/koenvanzuijlen/giantbomb-show-dl/compare/v1.3.0...v1.4.0) (2021-10-04)


### Features

* announce package name and version on start ([1cec8d2](https://github.com/koenvanzuijlen/giantbomb-show-dl/commit/1cec8d20a5abd0da0cd4f2bbf0589c8e23e64562))

## [1.3.0](https://github.com/koenvanzuijlen/giantbomb-show-dl/compare/v1.2.0...v1.3.0) (2021-06-11)


### Features

* implement update-notifier ([44de5c7](https://github.com/koenvanzuijlen/giantbomb-show-dl/commit/44de5c7362ae96fb38f9eeb1a62a21480044fd2a))


### Bug Fixes

* make showname matching case-insensitive ([7553c1d](https://github.com/koenvanzuijlen/giantbomb-show-dl/commit/7553c1ddb37fd59510ab6d90697ad207681a882f))
* sanitize created directory name ([157962f](https://github.com/koenvanzuijlen/giantbomb-show-dl/commit/157962f57d690a0ea0626e449c91543f3c57a22e))

## [1.2.0](https://github.com/koenvanzuijlen/giantbomb-show-dl/compare/v1.1.1...v1.2.0) (2021-06-08)


### Features

* add from_date and to_date options to set date range ([3ab836c](https://github.com/koenvanzuijlen/giantbomb-show-dl/commit/3ab836c3dede8207dfab2a6af90974d4986d4de0))


### Bug Fixes

* show informative message when no download URL was found ([ff953c4](https://github.com/koenvanzuijlen/giantbomb-show-dl/commit/ff953c45b6bd2e2b5ab314908b615d8f11db4483))

### [1.1.1](https://github.com/koenvanzuijlen/giantbomb-show-dl/compare/v1.1.0...v1.1.1) (2021-06-05)


### Bug Fixes

* always show correct version in commander ([32b6e4e](https://github.com/koenvanzuijlen/giantbomb-show-dl/commit/32b6e4ee1afbb5b8c0e44bab9dad18393b739c9c))

## [1.1.0](https://github.com/koenvanzuijlen/giantbomb-show-dl/compare/v1.0.1...v1.1.0) (2021-06-05)


### Features

* add quality option ([986acb3](https://github.com/koenvanzuijlen/giantbomb-show-dl/commit/986acb37711fa5443ea3a7fd4d1674c3233cc247))
