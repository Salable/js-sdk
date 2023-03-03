<p align="center">
  <a href="https://github.com/Salable/js-sdk" target="_blank" rel="noopener noreferrer">
    <img src="./docs/salable-logo.png" height="64">
  </a>
  <br />
</p>

<div align="center">

</div>

---

## Overview

Salable JS is a JavaScript library for building and managing a SaaS application's products, plans, subscriptions, and payment.

## Getting Started

### Installation

You can include Salable JS in your project by importing the SalableJS npm module or loading SalableJS with a script tag

### Install SalableJS with npm

```bash
npm instal @salable/salable-js
```

Once the installation is done, import the package and create and instance.

```typescript
import {Salable} from '@salable/salable-js';
const salable = new Salable('{your-api-key-here}');
```

### Install SalableJS with script tag

```html
<script async>
  import {Salable} from 'https://cdn.salable.app/latest/index.js';

  const salable = new Salable(`{your-api-key-here}`);
</script>
```

## License

This project is licensed under the **MIT license**.

See [LICENSE](https://github.com/Salable/js-sdk/tree/main/packages/salable-js/LICENSE) for more information.
