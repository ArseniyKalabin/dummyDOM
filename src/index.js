import './index.css';

/** @jsx h */

function h(type, props, ...children) {
    return { type, props, children };
}

function createElement(node) {
    if (typeof node === "string") {
        return document.createTextNode(node);
    }
    const $el = document.createElement(node.type);
    node.children.map(createElement).forEach($el.appendChild.bind($el));
    return $el;
}

function updateElement(root, nextState, currentState) {
    if (nextState === currentState) {
        root.childNodes[0].replaceWith(createElement(nextState));
        return;
    }
    let batch = notSoDeepDiff(nextState, currentState);
    console.log(batch);
    executeBatch(root, batch);
}

function notSoDeepDiff(newNode, oldNode, batch = []) {

    if (typeof newNode === "string" && typeof oldNode === "string") {
        //if node is textnode check equality and replace it or push emty patch into batch 
        if (newNode !== oldNode) {
            batch.push({ patch: { action: 'text', target: newNode }, children: [] });
        } else {
            batch.push({ patch: null, children: [] });
        }
    } else if (newNode.type === oldNode.type) {
        //if nodes have the same type let's compare their attributes
        batch.push(compareProps(newNode.props, oldNode.props));
        for (let i = 0; i < newNode.children.length; i++) {
            // compare children nodes one by one on their indexes
            if (oldNode.children[i]) {
                //dats recursion son
                batch[batch.length - 1].children[i] = notSoDeepDiff(newNode.children[i], oldNode.children[i], batch[batch.length - 1].children)[i];
            } else {
                batch[batch.length - 1].children.push({ patch: { action: 'add', target: newNode.children[i] }, children: [] });
            }
        }
        //mark to delete the rest of non-used old node elements
        for (let i = newNode.children.length; i < oldNode.children.length; i++) {
            batch[batch.length - 1].children.push({ patch: { action: 'delete', target: i }, children: [] });
        }
    } else {
        //if type of nodes are not the same just replace old node with new one
        batch.push({ patch: { action: 'replace', target: newNode }, children: [] });
    }

    return batch;
}

function compareProps(newProps, oldProps) {
    let patches = { patch: { action: 'props', target: [] }, children: [] };
    Object.keys(newProps).filter(prop => !prop.startsWith('__')).forEach(prop => {
        patches.patch.target.push({ action: 'addOrReplaceProp', target: [prop, newProps[prop]] });
    });
    Object.keys(oldProps).filter(prop => !prop.startsWith('__')).forEach(prop => {
        if (!newProps[prop]) {
            patches.patch.target.push({ action: 'deleteProp', target: prop });
        }
    });

    if (patches.patch.target.length) {
        return patches;
    } else {
        return { patch: null, children: [] };
    }

}

function executeBatch(realDOM, batch) {
    for (let i = 0; i < batch.length; i++) {
        if (batch[i].patch !== null) {
            switch (batch[i].patch.action) {
                case "replace":
                    realDOM.childNodes[i].replaceWith(createElement(batch[i].patch.target));
                    break;
                case "add":
                    realDOM.appendChild(createElement(batch[i].patch.target));
                    break;
                case "delete":
                    if (realDOM.childNodes[batch[i].patch.target]) realDOM.childNodes[batch[i].patch.target].remove();
                    break;
                case "text":
                    realDOM.childNodes[i].replaceWith(batch[i].patch.target);
                    break;
                case "props":
                    batch[i].patch.target.forEach(patch => {
                        switch (patch.action) {
                            case "addOrReplaceProp":
                                realDOM.childNodes[i].setAttribute(patch.target[0], patch.target[1]);
                                break;
                            case "deleteProp":
                                realDOM.childNodes[i].removeAttribute(patch.target);
                                break;
                            default:
                                console.log('Something wrong with props patch:');
                                console.log(patch);
                        }
                    });
                    break;
                default:
                    console.log('Something wrong with node patch:');
                    console.log(batch[i].patch);
            }
        }
        if (batch[i].children.length) {
            executeBatch(realDOM.childNodes[i], batch[i].children);
        }
    }
}

const initDOM = (
    <div>
        <p>Hello!</p>
        <ul>
            <li>How is it going?</li>
        </ul>
    </div>
);

const addNode = (
    <div>
        <p>Hello!</p>
        <ul>
            <li>How is it going?</li>
        </ul>
        <p>Good</p>
    </div>
);

const removeNode = (
    <div>
        <p>Hello!</p>
        <ul>
            <li>How is it going?</li>
        </ul>
    </div>
);

const changeNode = (
    <div>
        <p>Hi!</p>
        <ul>
            <li>How is it going?</li>
        </ul>
    </div>
);

const replaceNode = (
    <div>
        <span>This is SPAN!</span>
        <ul>
            <li>How is it going?</li>
        </ul>
    </div>
);

const addPropsNode = (
    <div>
        <span class="disProp" another="datProp">This is SPAN!</span>
        <ul>
            <li>How is it going?</li>
        </ul>
    </div>
)
    ;
const changeAndRemovePropsNode = (
    <div>
        <span class="notDisPropAnymore">This is SPAN!</span>
        <ul>
            <li>How is it going?</li>
        </ul>
    </div>
);

const rootElement = document.getElementById("root");
rootElement.appendChild(createElement(initDOM));

const initNodeButton = document.createElement("button");
initNodeButton.innerText = "Init";
rootElement.appendChild(initNodeButton);
initNodeButton.addEventListener("click", () => {
    updateElement(rootElement, initDOM, initDOM);
});

const addNodeButton = document.createElement("button");
addNodeButton.innerText = "Add";
rootElement.appendChild(addNodeButton);
addNodeButton.addEventListener("click", () => {
    updateElement(rootElement, addNode, initDOM);
});

const removeNodeButton = document.createElement("button");
removeNodeButton.innerText = "Remove";
rootElement.appendChild(removeNodeButton);

removeNodeButton.addEventListener("click", () => {
    updateElement(rootElement, removeNode, addNode);
});

const changeNodeButton = document.createElement("button");
changeNodeButton.innerText = "Change";
rootElement.appendChild(changeNodeButton);

changeNodeButton.addEventListener("click", () => {
    updateElement(rootElement, changeNode, removeNode);
});

const replaceNodeButton = document.createElement("button");
replaceNodeButton.innerText = "Replace";
rootElement.appendChild(replaceNodeButton);

replaceNodeButton.addEventListener("click", () => {
    updateElement(rootElement, replaceNode, changeNode);
});

const addPropsNodeButton = document.createElement("button");
addPropsNodeButton.innerText = "Add Props";
rootElement.appendChild(addPropsNodeButton);

addPropsNodeButton.addEventListener("click", () => {
    updateElement(rootElement, addPropsNode, replaceNode);
});

const changeAndRemovePropsNodeButton = document.createElement("button");
changeAndRemovePropsNodeButton.innerText = "Play With Props";
rootElement.appendChild(changeAndRemovePropsNodeButton);

changeAndRemovePropsNodeButton.addEventListener("click", () => {
    updateElement(rootElement, changeAndRemovePropsNode, addPropsNode);
});