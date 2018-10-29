<p align="center">
  <img src="https://i.imgur.com/0cSIPzP.png" width="300" height="300" alt="pixelbug">
  <br>
  <a href="https://www.npmjs.org/package/pixelbug"><img src="https://img.shields.io/npm/v/pixelbug.svg?style=flat" alt="npm"></a>
  <a href="https://www.npmjs.com/package/pixelbug"><img src="https://img.shields.io/npm/dt/pixelbug.svg" alt="downloads" ></a>
  <a href="https://travis-ci.org/argyleink/pixelbug"><img src="https://travis-ci.org/argyleink/pixelbug.svg?branch=master" alt="travis"></a>
</p>

# PixelBug

> Browser destools: point, click & tinker

- Edit or style **any page**, in **any state**, like it's an artboard

- **Hover inspect** styles, accessibility and alignment

- **Perfect layouts & content**, in the real end environment, at any device size

- **Leverage** adobe/sketch **skills**

- **Edit** any text, **replace** any image (hi there copywriters, ux writers, pms)

- Design **within the chaos**: use production or prototypes and the **odd states** they produce, **as artboards** and design opportunities

- **Simulate** latency, i18n, platform constraints, CPUs, screensize, etc to empathize with users and update designs

- **Make more decisions** on the front end of your site/app (a11y, responsive, edge cases, etc)

- **No waiting** for developers to expose their legos, **just go direct** and edit the end state (regardless of framework) and **execute/test an idea**

### Give **power to designers & content creators**, in a place where they currenly feel they have little to none, **by bringing design tool interactions and hotkeys to the browser**



> 🤔 **It's not:**
>
> -   **A competitor** to design tools like Figma, Sketch, XD, etc; **it's a compliment**
> -   Something you would use **to start from scratch**
> -   A **design system recognizer**, enforcer, enabler, or anything
> -   An **interaction** prototyping tool

## Installation

### Chrome Extension
(Install PixelBug)[https://chrome.google.com/webstore/detail/pixelbug/fffabomofckmjcahkllocjbiijpooiib]

### Web Component
```sh
npm i pixelbug
```

* * *

## API
While one of pixelbug's goals is to provide a familiar interface, its API may differ from other `fetch` polyfills/ponyfills. 
One of the key differences is that pixelbug focuses on implementing the [`fetch()` API](https://fetch.spec.whatwg.org/#fetch-api), while offering minimal (yet functional) support to the other sections of the [Fetch spec](https://fetch.spec.whatwg.org/), like the [Headers class](https://fetch.spec.whatwg.org/#headers-class) or the [Response class](https://fetch.spec.whatwg.org/#response-class).
pixelbug's API is organized as follows:

## Contribute

First off, thanks for taking the time to contribute!
Now, take a moment to be sure your contributions make sense to everyone else.

### Reporting Issues

Found a problem? Want a new feature? First of all see if your issue or idea has [already been reported](../../issues).
If it hasn't, just open a [new clear and descriptive issue](../../issues/new).

### Submitting pull requests

Pull requests are the greatest contributions, so be sure they are focused in scope, and do avoid unrelated commits.

> 💁 **Remember: size is the #1 priority.**
>
> Every byte counts! PR's can't be merged if they increase the output size much.

-   Fork it!
-   Clone your fork: `git clone https://github.com/<your-username>/pixelbug`
-   Navigate to the newly cloned directory: `cd pixelbug`
-   Create a new branch for the new feature: `git checkout -b my-new-feature`
-   Install the tools necessary for development: `npm install`
-   Make your changes.
-   `npm run build` to verify your change doesn't increase output size.
-   `npm test` to make sure your change doesn't break anything.
-   Commit your changes: `git commit -am 'Add some feature'`
-   Push to the branch: `git push origin my-new-feature`
-   Submit a pull request with full remarks documenting your changes.

## License

[MIT License](LICENSE.md) © [Adam Argyle](https://argyleink.com)