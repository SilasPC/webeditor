
function setClasses(el, classList) {
	el.classList.remove(...el.classList)
	el.classList.add(...classList.split(" "))
}
function rotClasses(el, classList, addEmpty = true) {
	classList = classList.split(" ")
	if (addEmpty) classList.push("")
	let i = classList.findIndex(v => el.classList.contains(v))
	if (i == -1 || i >= classList.length) i = classList.length - 1
	if (classList[i]) {
		el.classList.remove(classList[i])
	}
	i = (i + 1) % classList.length
	if (classList[i]) {
		el.classList.add(classList[i])
	}
}
function btnsDecorator(...btns) {
	return (el) => {
		let d = document.createElement("DIV")
		d.style.position = "absolute"
		d.style.transform = "translate(0,-100%)"
		for (let [name, f] of btns) {
			let b = document.createElement("BUTTON")
			b.innerText = name
			b.onclick = () => f(el)
			d.appendChild(b)
		}
		return d
	}
}
function swapPrevSibling(el) {
	let prev = el.previousSibling
	let parent = el.parentElement
	if (!prev || !parent) return
	el.remove()
	parent.insertBefore(el, prev)
}

const cfg = {
	elementQuery: "[editable]",
	stopQuery: "[noedit]",
	onUpload(input) {
		let reader = new FileReader()
		reader.addEventListener(
			"load", () => {
				let img = document.createElement("IMG")
				img.src = reader.result;
				img.classList.add("w3-image")
				editor.insertNode(img)
				input.value = ""
			},
			false,
		);
		reader.readAsDataURL(input.files[0]);
	},
	basicStyles: ["code", "b", "i", "h1", "h2", "h3", "h4"],
	insertable: {
		"ul": `<ul><li></li></ul>`,
		"ol": `<ol><li></li></ol>`,
		"hr": `<hr>`,
		"a": `<a href="link">Link</a>`
	},
	layout: {
		"panel": {
			query: ".w3-panel",
			create() {
				return html(`<div class="w3-panel w3-leftbar w3-border-blue w3-margin w3-padding">what</div>`)
			}
		},
		"card": {
			query: ".w3-card-4",
			create() {
				return html(`<div class="w3-card-4 w3-round w3-white w3-padding w3-margin"></div>`)
			},
			decorator: btnsDecorator(
				["Delete", el => el.remove()],
			)
		},
		"col": {
			hidden: true,
			query: ".w3-col",
			html: `<div editable class="w3-col w3-padding w3-third"></div>`,
			decorator: btnsDecorator(
				["Delete", el => el.remove()],
				["1/2", el => setClasses(el, "w3-col w3-padding w3-half")],
				["1/3", el => setClasses(el, "w3-col w3-padding w3-third")],
				["2/3", el => setClasses(el, "w3-col w3-padding w3-twothird")],
				["<<", swapPrevSibling],
				["Align", el => rotClasses(el, "w3-center w3-right-align")],
			),
		},
		"container": {
			query: ".w3-container",
			html: `<div class="w3-container"></div>`,
			decorator: btnsDecorator(
				["Delete", el => el.remove()],
				["Auto", el => rotClasses(el, "w3-auto")],
				["Padding", el => rotClasses(el, "w3-padding w3-padding-32 w3-padding-64")],
				["Margin", el => rotClasses(el, "w3-margin")],
				["Align", el => rotClasses(el, "w3-center w3-right-align")],
			)
		},
		"row": {
			query: "div:has(>.w3-row:first-child)",
			create() {
				return html(`
					<div noedit class="w3-padding">
						<div class="w3-row">
						</div>
					</div>
				`)
			},
			decorator: btnsDecorator(
				["Delete", el => el.remove()],
				["Column", el => el.querySelector(".w3-row").appendChild(html(`<div editable class="w3-col w3-third w3-padding"></div>`))],
			),
		},
	}
}

class Editor {

	#l = Symbol()
	#x = Symbol()
	#els = new Set()
	#decs = new Set()
	#lels = new Set()

	constructor(cfg) {
		window.onbeforeunload = function() {
			return true;
		};
		this.cfg = cfg
		for (let key in cfg.layout) {
			cfg.layout[key].name = key
		}
		this.#createInputBar()
		this.targetElement = null
		/* document.addEventListener("mouseup", async () => {
			this.clean()
			this.#undecorate()
		}) */
		addEventListener("paste", this.#handlePaste.bind(this))
		this.textInput.onchange = () => {
			if (this.targetElement?.nodeName == "A")
				this.targetElement.href = this.textInput.value
		}
		addEventListener("click", this.#handleClick.bind(this))
		this.#makeEditable(document.body)
		this.#findLayoutElements(document.body)
		let obs = new MutationObserver(_ => {
			this.#makeEditable(document.body)
			this.#findLayoutElements(document.body)
		})
		obs.observe(document.body, {"subtree": true, "childList": true})
		document.head.appendChild(html(`
			<style>
				[contenteditable=true] {
					border: 1px solid blue;
				}
				[contenteditable=true] * {
					min-height: 32px;
				}
				[decorator], [decorator] * {
					user-select: none;
					-moz-user-select: none;
					-khtml-user-select: none;
					-webkit-user-select: none;
					-o-user-select: none;
				}
			</style>
		`))
	}

	calculateDifference() {
		this.#undecorate()
		for (let el of this.#els) {
			if (this.#inEditableRegion(el, false)) continue
			if (el[this.#x] != el.innerHTML) {
				let blob = new Blob([el.innerHTML], {type: "text/plain"})
				let url = URL.createObjectURL(blob)
				let a = document.createElement("a")
				a.href = url;
				a.download = el["editable"] || ""
				document.body.appendChild(a);
				a.click();
				setTimeout(function() {
						document.body.removeChild(a);
						window.URL.revokeObjectURL(url);
				}, 0);
			}
		}
	}

	#undecorate() {
		for (let d of this.#decs) {
			d.remove()
		}
		this.#decs.clear()
	}

	#makeEditable(container) {
		for (let el of container.querySelectorAll(cfg.stopQuery)) {
			el.contentEditable = false
		}
		for (let el of container.querySelectorAll(cfg.elementQuery)) {
			this.#els.add(el)
			// el.style.display = "inline-block"
			el[this.#x] = el.innerHTML
			el.contentEditable = true
		}
	}

	#findLayoutElements(container) {
		for (let x of Object.values(this.cfg.layout)) {
			// console.log(x)
			for (let el of container.querySelectorAll(x.query)) {
				el[this.#l] = x
				this.#lels.add(el)
			}
		}
	}

	#createInputBar() {
		let t = document.createElement("div")
		for (let v of this.cfg.basicStyles) {
			let b = document.createElement("BUTTON")
			b.innerText = v
			b.onclick = () => this.#style(v)
			t.appendChild(b)
		}
		for (let [k,v] of Object.entries(this.cfg.insertable)) {
			let b = document.createElement("BUTTON")
			b.innerText = k
			b.onclick = () => this.#insertNode(html(v))
			t.appendChild(b)
		}
		for (let [k, v] of Object.entries(this.cfg.layout)) {
			if (v.hidden) continue
			let b = document.createElement("BUTTON")
			b.innerText = k
			b.onclick = () => {
				let el = v.html ? html(v.html) : v.create()
				if (el = this.#insertNode(el)) {
					this.#findLayoutElements(el.parentElement)
					this.#makeEditable(el.parentElement)
					this.#setTargetElement(el)
					el.focus()
				}
			}
			t.appendChild(b)
		}
		t.appendChild(this.fileInput = html(`<input type="file" onchange="cfg.onUpload(this)"></input>`))
		t.appendChild(this.textInput = html(`<input ></input>`))
		let b = document.createElement("BUTTON")
		b.innerText = "Save"
		b.onclick = () => {
			this.calculateDifference()
		}
		t.appendChild(b)

		b = document.createElement("BUTTON")
		b.innerText = "Clean"
		b.onclick = () => {
			this.clean()
		}
		t.appendChild(b)

		// t.style.position = "fixed"

		document.body.prepend(t)
	}

	#style(nodeName) {
		nodeName = nodeName.toUpperCase()
		var selection = window.getSelection();
		if (selection.isCollapsed) return;

		var range = selection.getRangeAt(0);

		const startContainerNode = this.#isInside(range.startContainer, nodeName);
		const endContainerNode = this.#isInside(range.endContainer, nodeName);
		if (startContainerNode !== false || endContainerNode !== false) {
			// both range container nodes are part of the same node
			if (startContainerNode === endContainerNode) {
				this.#removeNode(startContainerNode);
			}
			else {
				// remove start container node
				if (startContainerNode !== false) {
					this.#removeNode(startContainerNode);
				}
				// remove end container node
				if (endContainerNode !== false) {
					this.#removeNode(endContainerNode);
				}
			}
		}
		else {
			// check if the selection fully contains a node of the same type
			// e.g. "Hello <strong>World</strong>!", if we would just surround the selection, the <strong>s would be nested like "<strong>Hello <strong>World</strong>!</strong>", which works, but isn't pretty, so we remove all nodes of the same type that are fully within the selection
			for (let i = 0; i < range.commonAncestorContainer.childNodes.length; ++i) {
				if (range.commonAncestorContainer.childNodes[i].nodeName === nodeName) {
					removeNode(range.commonAncestorContainer.childNodes[i]);
				}
			}

			var newNode = document.createElement(nodeName);
			newNode.appendChild(range.extractContents());
			range.insertNode(newNode);
		}

		selection.empty();
		this.clean();

	}

	#inEditableRegion(node, local = true) {
		if (node.contentEditable == "true") return true
		if (node.contentEditable == "false" && local) return false
		if (!node.parentElement) return false
		return this.#inEditableRegion(node.parentElement)
	}

	#isInside(node, nodeName) {
		if (node.parentElement == null) return false
		if (node.parentElement.nodeName === nodeName) {
			return node.parentElement;
		}
		else {
			return this.#isInside(node.parentElement, nodeName);
		}
	}

	#handlePaste(event) {
		// cancel paste
		event.preventDefault();

		// get text representation of clipboard
		var text = (event.originalEvent || event).clipboardData.getData("text/plain");

		// keep line breaks
		text = text.replaceAll("\r\n", "<br>");
		text = text.replaceAll("\n", "<br>");

		var selection = window.getSelection();
		if (selection.rangeCount === 0) return;
		var range = selection.getRangeAt(0);
		if (selection.toString().length === 0) {
			// range.deleteContents();
			var tmpDiv = document.createElement("div");
			tmpDiv.innerHTML = text;
			range.insertNode(tmpDiv);
			selection.empty();
			this.clean();
		}
	}

	async #handleClick(event) {
		if (this.#inEditableRegion(event.target, false)) {
			this.#setTargetElement(event.target)
		} else {

		}
	}

	/// Applies decoration to the path of the targeted element
	#setTargetElement(el) {
		this.targetElement = el
		if (el.href?.startsWith(document.location.origin)) {
			this.textInput.value = el.pathname ?? ""
		} else {
			this.textInput.value = el.href ?? ""
		}
		this.#undecorate()
		let path = ""
		while (el) {
			path = el.nodeName + " " + path
			let l = el[this.#l]
			console.log(el, l)
			if (l && l.decorator) {
				console.log("decorate " + l.name)
				let dec = l.decorator(el)
				dec.contentEditable = false
				dec.setAttribute("decorator","")
				el.prepend(dec)
				this.#decs.add(dec)
			}
			el = el.parentElement
			// if (this.#els.has(el))
		}
		console.log(path)
	}

	/// Cleans up some nasty html
	clean() {
		for (let container of this.#els) {
			container.innerHTML = container.innerHTML.replaceAll("&nbsp;", " ");
			for (let el of container.querySelectorAll("div:has(br:nth-child(2):last-child),div:has(br:only-child)")) {
				el.replaceWith(el.childNodes[0])
			}
			for (let el of container.querySelectorAll("div:empty")) {
				el.remove()
			}
		}
	}

	insertNode(el) { return this.#insertNode(el) }

	/// Inserts element at cursor
	#insertNode(el) {
		if (typeof el == "string") {
			el = document.createElement(el.toUpperCase())
		}
		if (el instanceof DocumentFragment) {
			el = el.childNodes[0]
		}
		var selection = window.getSelection();
		if (selection.rangeCount === 0) return null;
		var range = selection.getRangeAt(0);
		if (selection.type === "Caret") {
			range.insertNode(el);
			range.insertNode(document.createElement("BR"))
			selection.empty();
			return el
		}
		return null
	}


	#removeNode(node) {
		let parent = node.parentElement;
		//for (let i = 0; i < parent.childNodes.length; ++i) {
			//if (parent.childNodes[i] === node) {
				while (node.childNodes.length > 0) {
					parent.insertBefore(node.firstChild, node);
				}
				node.remove()
				//return;
			//}
		//}
	}


}

new Editor(cfg)

function html(innerHTML) {
	let t = document.createElement("template")
	t.innerHTML = innerHTML
	console.log(t.content.children.length)
	console.log(t.content)
	return t.content.children[0]
}

