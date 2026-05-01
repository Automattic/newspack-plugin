# Subscribers prototype — tags + newsletters

Design spec for two additions to the Subscribers management prototype shipped in [PR #4649](https://github.com/Automattic/newspack-plugin/pull/4649) on the `prototype/subscribers-demo` branch.

## Goals

1. Let admins attach short, free-form **tags** (e.g. `vip`, `valued-reader`, `met-in-person`) to a subscriber from the L1 profile and filter the L0 list by tag.
2. Let admins see and modify a subscriber's **newsletter subscriptions** from the L1 profile and filter the L0 list by newsletter membership.

Both features stay within the prototype's existing constraints: mock data in `src/wizards/subscribersDemo/data/mock-subscribers.js`, localStorage persistence, no REST endpoint or backend wiring. Production wiring will be designed separately.

## Non-goals

- Backend persistence, REST endpoints, or user/post meta storage.
- Tag management UI (rename, merge, delete across all subscribers).
- Newsletter creation or sync with the actual newsletters plugin / ESP.
- Bulk tag/newsletter operations from the L0 DataViews.

## Context

The prototype is a hidden wizard at `admin.php?page=newspack-subscribers-demo` with three levels:

- **L0** (`src/wizards/subscribersDemo/screens/SubscriberList.jsx`) — DataViews list with `Status` and `Plan` filters using the `isAny` operator, sorted by last payment.
- **L1** (`src/wizards/subscribersDemo/screens/PersonProfile.jsx`) — Two-column `Row`-based layout with header (status badge + email + status summary lines), notes Cards, Subscriptions Row, Payment methods Row, and an Order history table.
- **L2** — Modal flows under `src/wizards/subscribersDemo/flows/` (e.g. `NoteFlow.jsx`).

Private notes already establish the prototype's pattern for admin-only annotations: kebab → modal → localStorage → transient `Snackbar`. Tags follow the same pattern, with FormTokenField in place of TextareaControl.

## Architecture

### Data shape additions

`mock-subscribers.js` gains two new exports:

```js
export const KNOWN_TAGS = [ 'vip', 'valued-reader', 'met-in-person' ];

export const NEWSLETTERS = [
  { id: 'daily',    name: 'Daily Brief',    description: 'Top stories every weekday morning.' },
  { id: 'weekly',   name: 'Weekend Read',   description: 'Long reads delivered Saturday.' },
  { id: 'arts',     name: 'Arts & Culture', description: 'Reviews and what's on, monthly.' },
  { id: 'breaking', name: 'Breaking News',  description: 'Real-time alerts on major stories.' },
];

export const ALL_TAGS = [ ...new Set( SUBSCRIBERS.flatMap( s => s.tags || [] ) ) ].sort();
```

Each subscriber object gains two optional fields:

- `tags: string[]` — lowercase, trimmed, deduplicated.
- `newsletters: string[]` — array of newsletter ids that the subscriber is subscribed to.

### Seeded fixture data

The five hand-crafted fixtures get deterministic tags and newsletter subscriptions:

| Fixture       | tags                          | newsletters                       |
| ------------- | ----------------------------- | --------------------------------- |
| Matt Moore    | `['valued-reader']`           | `['daily', 'weekly']`             |
| Jane Chen     | `[]`                          | `['daily']`                       |
| Priya Patel   | `['vip', 'valued-reader']`    | `['daily', 'weekly', 'arts']`     |
| Aisha Khan    | `['met-in-person']`           | `['daily', 'breaking']`           |
| Oscar Rivera  | `[]`                          | `[]`                              |

The 42 pseudo-random extras get tags and newsletters generated via the existing seeded `mulberry32(42)` PRNG so the list stays stable across reloads:

- ~40% of extras get 1–2 random tags from `KNOWN_TAGS`.
- ~70% of extras get 1–3 random newsletter ids from `NEWSLETTERS`.

This guarantees the L0 filter element lists are populated from the first load and reviewers can exercise all filter combinations without seeding state by hand.

### Persistence (prototype only)

Mirrors the existing notes persistence in `mock-subscribers.js`, with one important difference: tags and newsletters have **seeded fixture values**, so the storage API must distinguish "no entry for this subscriber yet" (use the seeded fixture value) from "entry exists but is empty" (the user intentionally cleared all tags/newsletters).

```js
const TAGS_STORAGE_KEY        = 'newspack-subscribers-demo:tags';
const NEWSLETTERS_STORAGE_KEY = 'newspack-subscribers-demo:newsletters';

// Returns the stored array if an entry exists for the id, or `null` if not.
// Callers fall back to the seeded fixture value when this returns `null`.
export function getStoredTags( id ) { /* ... */ }
export function setStoredTags( id, tags ) { /* ... */ } // setting [] keeps the entry (so user-cleared survives reload)
export function getStoredNewsletters( id ) { /* ... */ }
export function setStoredNewsletters( id, ids ) { /* ... */ }
```

Same fail-silent behavior on storage errors. Same code comment flagging that production needs server-side storage.

In `PersonProfile.jsx`, the existing `useMemo` that already merges stored notes onto the seeded fixture is extended to merge tags and newsletters too:

```js
const initial = useMemo( () => {
  const found = getSubscriberById( id );
  if ( ! found ) return found;
  const storedTags = getStoredTags( id );
  const storedNewsletters = getStoredNewsletters( id );
  return {
    ...found,
    notes: getStoredNotes( id ),
    tags: storedTags !== null ? storedTags : ( found.tags || [] ),
    newsletters: storedNewsletters !== null ? storedNewsletters : ( found.newsletters || [] ),
  };
}, [ id ] );
```

A pair of sibling effects mirrors the existing notes effect, persisting the two arrays to localStorage whenever they change.

**Known prototype caveats:**

- The L0 `SubscriberList` reads from the in-memory `SUBSCRIBERS` array and does not merge per-subscriber localStorage overrides. So tag/newsletter changes made on L1 are not reflected in the L0 row's "Tags" or "Newsletters" cells, nor in the L0 `ALL_TAGS` filter element list, until a hard reload (and even then, only if the change was made on a fixture's pre-seeded id — random extras are regenerated at module load). This matches the existing notes prototype behavior (notes also don't surface on L0). Documented as a code comment in `mock-subscribers.js`; acceptable for a prototype.

## Components

### 1. Header — tag display (L1)

In `PersonProfile.jsx`, the existing `setHeaderData({ sectionDescription })` `VStack` already renders the email plus 1–2 status summary lines. A new tag chip line is appended after those when `subscriber.tags?.length > 0`:

```jsx
{ ( subscriber.tags || [] ).length > 0 && (
  <HStack spacing={ 1 } justify="flex-start" wrap>
    { subscriber.tags.map( t => <Badge key={ t } level="info" text={ t } /> ) }
  </HStack>
) }
```

The kebab `actions` array gains a new entry between "Edit WordPress user" and "Add private note":

```js
{ type: 'more', label: __( 'Manage tags', 'newspack-plugin' ), action: () => setModal( { kind: 'tags' } ) },
```

Tag chips in the header are read-only — removal happens inside the modal. This keeps `Badge` semantics consistent (status pill ≠ removable).

### 2. `TagsFlow.jsx` (new file)

Path: `src/wizards/subscribersDemo/flows/TagsFlow.jsx`. Modeled directly on `NoteFlow.jsx`.

```jsx
import { useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { FormTokenField, __experimentalHStack as HStack, __experimentalVStack as VStack } from '@wordpress/components';
import { Button, Modal } from '../../../../packages/components/src';
import { KNOWN_TAGS } from '../data/mock-subscribers';

const normalize = tokens =>
  [ ...new Set( tokens.map( t => String( t ).trim().toLowerCase() ).filter( Boolean ) ) ];

export default function TagsFlow( { tags = [], onClose, onComplete } ) {
  const [ next, setNext ] = useState( tags );
  const dirty = JSON.stringify( normalize( next ) ) !== JSON.stringify( normalize( tags ) );

  const submit = () => {
    const finalTags = normalize( next );
    onComplete( {
      type: 'success',
      transient: true,
      message: __( 'Tags updated.', 'newspack-plugin' ),
      mutate: subscriber => ( { ...subscriber, tags: finalTags } ),
    } );
  };

  return (
    <Modal title={ __( 'Manage tags', 'newspack-plugin' ) } onRequestClose={ onClose }>
      <VStack spacing={ 4 }>
        <FormTokenField
          label={ __( 'Tags', 'newspack-plugin' ) }
          value={ next }
          suggestions={ KNOWN_TAGS }
          onChange={ setNext }
          __experimentalExpandOnFocus
          __next40pxDefaultSize
          __nextHasNoMarginBottom
        />
        <p>{ __( 'Tags are visible only to admins. Press Enter or comma to add.', 'newspack-plugin' ) }</p>
        <HStack spacing={ 2 } justify="flex-end">
          <Button variant="secondary" size="compact" onClick={ onClose }>
            { __( 'Cancel', 'newspack-plugin' ) }
          </Button>
          <Button variant="primary" size="compact" onClick={ submit } disabled={ ! dirty }>
            { __( 'Save', 'newspack-plugin' ) }
          </Button>
        </HStack>
      </VStack>
    </Modal>
  );
}
```

`PersonProfile.jsx` renders it via the existing modal switch:

```jsx
{ modal?.kind === 'tags' && <TagsFlow tags={ subscriber.tags || [] } onClose={ closeModal } onComplete={ completeFlow } /> }
```

The `useEffect` that already persists notes is extended (or paired with a sibling effect) to persist `subscriber.tags` to `setStoredTags( id, tags )`.

### 3. Newsletters Row (L1)

A new `Row` is inserted between the Subscriptions Row and the Payment methods Row in `PersonProfile.jsx`:

```jsx
<Row
  title={ __( 'Newsletters', 'newspack-plugin' ) }
  description={ __( 'Email lists this subscriber receives.', 'newspack-plugin' ) }
>
  <Card __experimentalCoreCard>
    <VStack spacing={ 4 }>
      { NEWSLETTERS.map( newsletter => {
        const isSubscribed = ( subscriber.newsletters || [] ).includes( newsletter.id );
        return (
          <HStack key={ newsletter.id } justify="space-between">
            <VStack spacing={ 1 }>
              <strong>{ newsletter.name }</strong>
              <span>{ newsletter.description }</span>
            </VStack>
            <ToggleControl
              checked={ isSubscribed }
              onChange={ () => {
                const nextList = isSubscribed
                  ? ( subscriber.newsletters || [] ).filter( id => id !== newsletter.id )
                  : [ ...( subscriber.newsletters || [] ), newsletter.id ];
                setSubscriber( prev => ( { ...prev, newsletters: nextList } ) );
                setSnackbar( {
                  message: isSubscribed
                    ? sprintf( __( 'Unsubscribed from %s.', 'newspack-plugin' ), newsletter.name )
                    : sprintf( __( 'Subscribed to %s.', 'newspack-plugin' ), newsletter.name ),
                } );
              } }
              __nextHasNoMarginBottom
            />
          </HStack>
        );
      } ) }
    </VStack>
  </Card>
</Row>
```

A sibling persistence effect mirrors the notes/tags pattern: `useEffect( () => setStoredNewsletters( id, subscriber.newsletters ), [ subscriber.newsletters ] )`.

### 4. L0 DataViews — Tags + Newsletters fields

Two new field definitions added to the `fields` memo in `SubscriberList.jsx`:

```js
{
  id: 'tags',
  label: __( 'Tags', 'newspack-plugin' ),
  elements: ALL_TAGS.map( t => ( { value: t, label: t } ) ),
  filterBy: { operators: [ 'isAny' ] },
  getValue: ( { item } ) => ( item.tags || [] ).join( ', ' ),
  render: ( { item } ) => (
    <HStack spacing={ 1 } wrap>
      { ( item.tags || [] ).map( t => <Badge key={ t } level="info" text={ t } /> ) }
    </HStack>
  ),
  enableSorting: false,
},
{
  id: 'newsletters',
  label: __( 'Newsletters', 'newspack-plugin' ),
  elements: NEWSLETTERS.map( n => ( { value: n.id, label: n.name } ) ),
  filterBy: { operators: [ 'isAny' ] },
  getValue: ( { item } ) =>
    ( item.newsletters || [] ).map( id => NEWSLETTERS.find( n => n.id === id )?.name ).filter( Boolean ).join( ', ' ),
  render: ( { item } ) => (
    <div>
      { ( item.newsletters || [] )
        .map( id => NEWSLETTERS.find( n => n.id === id )?.name )
        .filter( Boolean )
        .join( ', ' ) }
    </div>
  ),
  enableSorting: false,
},
```

`DEFAULT_VIEW.fields` stays as `[ 'status', 'plans', 'lastPayment', 'memberSince' ]` — the new columns are hidden by default but available via the DataViews column control. Filters work regardless of column visibility.

## Data flow

```
L1 mount
  ↳ getSubscriberById(id) → seeded subscriber
  ↳ getStoredTags(id) → if non-null, overrides seeded .tags; if null, fixture value is used
  ↳ getStoredNewsletters(id) → if non-null, overrides seeded .newsletters; if null, fixture value is used

L1 user toggles a newsletter
  ↳ setSubscriber(prev => { ...prev, newsletters: nextList })
  ↳ useEffect → setStoredNewsletters(id, nextList)
  ↳ setSnackbar({ message })

L1 user opens kebab → Manage tags
  ↳ setModal({ kind: 'tags' })
  ↳ TagsFlow renders with current tags
  ↳ user edits + saves → onComplete({ mutate, transient, message })
  ↳ PersonProfile setSubscriber + setSnackbar + setModal(null)
  ↳ useEffect → setStoredTags(id, tags)

L0 mount
  ↳ SUBSCRIBERS (in-memory mock) drives the table
  ↳ ALL_TAGS computed once from SUBSCRIBERS
  ↳ NEWSLETTERS imported from mock-subscribers.js
  ↳ Filters: isAny against item.tags / item.newsletters
```

## Error handling

- localStorage failures (quota, disabled) fail silently in `setStoredTags` / `setStoredNewsletters`, matching `setStoredNotes`.
- `tags` and `newsletters` arrays default to `[]` on read everywhere — every consumer guards with `( ... || [] )`.
- An unrecognized newsletter id (e.g. removed from `NEWSLETTERS` after being saved) is silently filtered out of the rendered list. Acceptable for the prototype.

## Testing

This is a design prototype, not production code, so the testing surface is manual review per the existing PR template. New manual checks added to the PR description:

1. **Tags — header**: Open Priya Patel — confirm `vip` and `valued-reader` Badges render under the email/status summary lines in the header.
2. **Tags — modal**: Open the kebab → "Manage tags" — confirm the FormTokenField is pre-populated with the current tags, that the three suggestions appear, and that typing `VIP` then Enter normalizes to `vip` and dedupes if already present.
3. **Tags — persistence**: Add a tag, reload the page, confirm the tag survives.
4. **Newsletters — Card**: Open Matt Moore — confirm the Newsletters Row renders between Subscriptions and Payment methods with four toggles, two on (Daily Brief, Weekend Read) and two off.
5. **Newsletters — toggle**: Toggle Arts & Culture on — confirm a "Subscribed to Arts & Culture." Snackbar fires at the bottom-left and the toggle stays on after reload.
6. **L0 — Tags filter**: Apply the Tags filter with `vip` selected — confirm only Priya appears (plus any random extras seeded with `vip`).
7. **L0 — Newsletters filter**: Apply the Newsletters filter with `breaking` selected — confirm Aisha appears (plus any random extras seeded with `breaking`).
8. **L0 — Column visibility**: Confirm Tags and Newsletters columns are hidden by default but available via the DataViews column control.

## Out of scope (deferred)

- Adding Tags / Newsletters to the bulk-action set on L0.
- Inline tag removal from the header chip (would require extending the Badge component).
- A "Manage all tags" admin screen for renaming/merging tags across subscribers.
- Real backend storage and migration from localStorage to user/post meta or an option.

These all belong to the productionization phase, not the prototype.
