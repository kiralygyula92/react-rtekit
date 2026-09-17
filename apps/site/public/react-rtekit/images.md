---
pluginId: react-rtekit
pathname: /react-rtekit/images/
title: 'Images & uploads'
description: Images by URL, by file picker or by drag-and-drop, resizable in place, with captions and an upload handler of your own.
archetype: B
section: features
capabilityId: images
group: 'Display & layout'
symbols: [ImageAttrs, UploadHandler, useUpload]
---

# Images & uploads

## Basics

```demo
images
```

## Customization

Every part of this is a slot, a token or a handler. See [How to customize](/react-rtekit/customization/) for the ten levels and how to pick one, and [Theming & tokens](/react-rtekit/customization/theme-tokens/) for the visual side.

## Limitations

Without an `onUpload` the file is embedded as a `data:` URL, which is what makes the picker work with no backend and what makes a large image a large document. Give it a handler for anything but small pictures.

## API

- [ImageAttrs](/react-rtekit/api/types/)
- [UploadHandler](/react-rtekit/api/types/)
- [useUpload](/react-rtekit/api/editor-hooks/)
