
# The What

A small no-dependencies, configurable, local, inplace, what-you-see-is-what-you-get editor, based on the work of pingpoli.

It is not terribly sophisticated, but certainly good enough for various simple editing.

# The Why

After deciding to switch to an oldschool, homebuilt, simple and static webpage, I needed
to make doing small edits easier for the family, rather than editing html/css.

# The How

Assuming you have a simple static website, with areas you want to edit only containing predictable layout elements.
1. Extend `Editor` to fit your needs (see w3css based example).
This includes how to generate interface and how to save changes.
2. Define the layout elements in the config.
3. Include script on webpage.
4. Profit.

# The bugs

No guarentees it is bug free. But from testing it seems mostly ok.

## Configuration

The config object expects the following:
 - `elementQuery`: defines the query selector for editable areas. There may be multiple areas.
 - `stopQuery`: defines the query for (typically layout elements) where editability stops. Within these other editable areas may be defined.
 - `layoutBaseQuery`: a query for elements that may contain other layout elements (typically div's)
 - `basicStyles`: basic toggleable inline-style elements, that need no special handling
 - `intertables`: a map of simple fully-editable insertable elements
 - `layout`: see layout below
 - `decorators`: a map of Element to Element functions that generates a hovering decorator for modifying the element when targeted
 - `decoratorHeight`: used to offset decorators vertically so they don't overlap
 - `avoidExit`: used by w3editor to enable/disable confirm-to-exit

### Layout

`layout` expects a map from custom element name (one you decide) to an object with the following keys:
 - `html`: snippet to insert on creation (may be null)
 - `string|Element create(el: Element?)`: allows creating an element possibly surounding `el` (may be null)
 - `query`: a css query that exclusively selects the othermost node of the custom element
 - `uneditable`: automatically makes the outermost element uneditable (otherwise use stopQuery if needed)
 - `Element? decorator(el: Element)`: see above

Specific to the example there are:
 - `hidden`: bool flag to not create a button to insert the element (eg. column can only be created via. row's decorator)

# The Example

`w3editor.js` and `editor_cfg.js` together provide an example based around [https://www.w3schools.com/w3css/default.asp](w3css).

"Saving" is performed by downloading the modified contents to a file, which can be pushed to the server later.
Thus this does not provide seamless saving, but it should be fairly straightforward to integrate if need be.

# Credits/licenses

The code is a modified version of the pingpoli editor (Christian Behler), without which I could not have made this.
The relevant licenses is included in the relevant files.

Based on the [https://pingpoli.de/creating-a-rich-text-editor](post) and [https://gist.github.com/pingpoli/f63eca5c7dc6955b25e4e79c342965e2](code) by [https://github.com/pingpoli](pingpoli).


