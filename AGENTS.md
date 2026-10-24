## Commits

- Before starting work that spans multiple concerns or is likely to need multiple commits, inspect the scope and propose a commit plan. For each commit, state its purpose and the main changes it will contain. Get the user's approval of the plan before implementation. A small, focused task can use a single commit without a separate plan.
- Keep each commit focused on one independently reviewable concern. Avoid combining setup, application behavior, and unrelated test or documentation changes unless they are inseparable. File count or diff size alone does not determine whether a commit is too large.
- Reassess the plan as implementation details emerge. If the scope expands or a better split becomes apparent, pause and agree on a revised plan before continuing with the affected work.
- Work on one planned commit at a time: stage only that slice and present its staged files and diff summary. Do not stage the next slice until the current slice has been committed.
- All changes will be reviewed by the user before committing
- Suggest an appropriate commit message for each change

### All commit messages should comply with conventional commits rules

**Bad Example:**

```
git commit -m "Refactor the BankListItem component to make it pure"
```

**Good Example:**

```
git commit -m "refactor(bank): make the BankListItem component pure"
```

### Always run the following commands before pausing for review:

- `pnpm build`
- `pnpm test:unit run --silent`
- `pnpm test:e2e`
- `pnpm lint`

## Testing

- Write unit tests and E2E tests for all changes when practical
- Mock dependencies additively, start with no mocks and build up only to the point necessary
- Aim for near 100% test coverage, use test tooling to check coverage and iterate

### Try to maintain one assertion per test

**Bad Example:**

```ts
it('buttons have right text', () => {
  const button1 = dataTestFind(wrapper, 'next-btn')
  const button2 = dataTestFind(wrapper, 'close-btn')
  expect(button1.text()).toBe('Next')
  expect(button2.text()).toBe('Close')
})
```

**Good Example:**

```ts
it('next button text is correct', () => {
  const button = dataTestGet(wrapper, 'next-btn')
  expect(button.text()).toBe('Next')
})

it('close button text is correct', () => {
  const button = dataTestGet(wrapper, 'close-btn')
  expect(button.text()).toBe('Close')
})
```

### Use table driven tests to represent many similar test cases in a compact form

**Bad Example:**

```ts
it('title has right text', () => {
  const title = dataTestGet(wrapper, 'title')
  expect(title.text()).toBe('Title')
})

it('description has right text', () => {
  const description = dataTestGet(wrapper, 'description')
  expect(description.text()).toBe('Description')
})

it('submit button has the right text', () => {
  const button = dataTestGet(wrapper, 'submit-btn')
  expect(button.text()).toBe('Submit')
})

it('back button has the right text', () => {
  const button = dataTestGet(wrapper, 'back-btn')
  expect(button.text()).toBe('Back')
})

it('close button has the right text', () => {
  const button = dataTestGet(wrapper, 'close-btn')
  expect(button.text()).toBe('Close')
})
```

**Good Example:**

```ts
it.each([
  { description: 'Title', id: 'title', text: 'Title' },
  { description: 'Description', id: 'description', text: 'Description' },
  { description: 'Submit button', id: 'submit-btn', text: 'Submit' },
  { description: 'Back button', id: 'back-btn', text: 'Back' },
  { description: 'Close button', id: 'close-btn', text: 'Close' },
])('$description has the right text', ({ id, text }) => {
  const el = dataTestGet(wrapper, id)
  expect(el.text()).toBe(text)
})
```

### What to test

Focus tests on **component-specific behavior**, not framework fundamentals or Vue internals.

**Don't test:**

- That props are passed to elements (e.g., `id` attribute works, `for` links to `id`)
- Basic Vue reactivity or HTML behavior
- Internal implementation details like CSS classes or calling `vm` methods directly

**Do test:**

- Business logic unique to the component
- Conditional rendering based on component state
- User interactions and their effects
- Edge cases in display logic

#### Testing user interactions instead of calling vm methods

Avoid calling `vm` functions directly. Instead, test through user interactions. The only place testing Vue internals is acceptable is at a system boundary (i.e. components from a library).

**Bad Example:**

```ts
it('handles button click correctly', () => {
  const vm = wrapper.vm

  vm.handleNext()

  expect(router.push).toBeCalledWith({
    name: ModuleRoutes.SubmitPage,
  })
})
```

**Good Example:**

```ts
it('handles button click correctly', () => {
  const button = dataTestGet(wrapper, 'next-btn')
  await button.trigger('click')
  expect(router.push).toBeCalledWith({
    name: ModuleRoutes.SubmitPage,
  })
})
```

#### Testing component behavior instead of implementation details

Test component behavior through props and emits rather than internal implementation details like CSS classes.

**Bad Example:**

```ts
it('shows filled state', () => {
  const trigger = wrapper.find('.trigger')
  expect(trigger.classes()).toContain('trigger--filled')
})
```

**Good Example:**

```ts
it('uses primary color when value is selected', () => {
  const hText = wrapper.findComponent({ name: 'HText' })
  expect(hText.props('color')).toBe('primary')
})
```

#### Testing component-specific logic instead of framework fundamentals

Don't test Vue/HTML fundamentals. Focus on the unique behavior of your component.

**Bad Example:**

```ts
// Testing Vue/HTML fundamentals - unnecessary
it('uses the provided id on the button', () => {
  const trigger = dataTestFind(wrapper, 'dropdown-select-trigger')
  expect(trigger.attributes('id')).toBe('test-dropdown')
})

it('displays the label and links it to the button', () => {
  expect(wrapper.text()).toContain('Test Label')
  expect(wrapper.find('label').attributes('for')).toBe('test-dropdown')
})
```

**Good Example:**

```ts
// Testing component-specific placeholder/displayText logic
it('displays the placeholder when displayText is empty', () => {
  const trigger = dataTestFind(wrapper, 'dropdown-select-trigger')
  expect(trigger.text()).toBe('placeholder')
})

it('displays the displayText when provided', () => {
  wrapper = mount(DropdownSelect, {
    ...defaultMountingOptions,
    props: {
      ...defaultMountingOptions.props,
      displayText: 'Selected Option',
    },
  })

  const trigger = dataTestFind(wrapper, 'dropdown-select-trigger')
  expect(trigger.text()).toBe('Selected Option')
})
```
