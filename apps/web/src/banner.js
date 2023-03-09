const BANNER = `/**
 * MIT Licensed
 * Copyright (c) 2022-present ByteDance, Inc. and its affiliates.
 * https://github.com/modern-js-dev/rspack/blob/main/LICENSE
 */
`;

module.exports = function (content) {
  return `${BANNER}${content}`;
};