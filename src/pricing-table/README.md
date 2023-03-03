# Salable pricing table documentation

- Pricing table will show plans that have been selected in Salable
- Plans will show based on interval (monthly, yearly). Button toggle will show and hide plans based on interval selected

## Environment config options

`pricingTableNode` - Node of pricing table on page  
`productUuid` - Product `uuid` of the plans you want in the pricing table  
`organisationId`???  
`apiKey` - Authentication to api  
`authToken` - Authentication to api  
`vendor` - Payment provider vendor id  
`globalCtaOptions`

#### Full globalCtaOptions example

```
globalCtaOptions: {
  visibility: "hidden",
  text: {
    standard: "Standard cta text",
    enterprise: "Enterprise cta text",
    comingSoon: "Coming soon cta text"
  },
  callback: ({planId, paddlePlanId, type, callback}) => {
    // your code here
  }
}
```

- `visibility` - if left blank default is visible
  - `hidden` - hide all ctas
- `text` - change cta text for all ctas of plan license type
  - `standard: "Standard cta text"`
  - `enterprise: "Enterprise cta text"`
  - `comingSoon: "Coming soon cta text"`
- `callback({planId, paddlePlanId, type, callback})`  
  A function to override all plan cta click events, data available in callback object -
  - `planId`
  - `paddlePlanId`
  - `type`

`individualCtaOptions`

#### Full individualCtaOptions example

```
individualCtaOptions: {
  "01FNRSR1D0PXEBDJWJRNGVA87X": {
    visibility: "hidden",
    text: "Individual cta text",
    callback: ({planId, paddlePlanId, type, callback}) => {
      // your code here
    }
  }
}
```

- `visibility` - if left blank default is visible
  - `hidden` - hide cta
- `text` - change cta text
- `callback({planId, paddlePlanId, type, callback})`  
  A function to override plan cta click event, data available in callback object
  - `planId`
  - `paddlePlanId`
  - `type`

## Checkout config options

Pre-fill customer data in checkout  
`email`  
`postcode`  
`country`

## Full HTML example

```
<div id="pricing-table"></div>

<script type="module">
    import {Salable} from "../src/salable.js";
    (async () => {
        const salable = new Salable(
            {
                pricingTableNode: document.querySelector('#pricing-table'),
                productUuid: '9449341f-8b35-4945-856e-55bda1c11000',
                apiKey: 'tbpiEqqQLj6gRkpqvMNx83bqDG97GiBwqWLm9Am6',
                globalPlanOptions: {
                    granteeId: 'example-grantee-id-12345',
                    successUrl: 'https://example.com/success',
                    cancelUrl: 'https://example.com/cancel',
                }
            },
            {
                member: 'member-test-17-05'
            }
        );
        await salable.init();
    })();
</script>
```
