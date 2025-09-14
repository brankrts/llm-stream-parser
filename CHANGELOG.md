# Changelog

## [Unreleased]

### Fixed

- **HTML Content Parsing**: HTML tags are no longer processed as XML tags,
  treated as raw content
- **Tag Filtering**: Only registered tags are processed, unregistered tags are
  added as content
- **Nested Content**: HTML content within nested tags is properly handled via
  `tag_content_update` event

### Changed

- Parser now only processes explicitly registered tags
- Unregistered tags (like HTML elements) are treated as raw content instead of
  being parsed

## [1.1.0] - 2025-09-14
