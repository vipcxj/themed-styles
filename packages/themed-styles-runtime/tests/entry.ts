import { createTheme, Styles } from '../src';
// tslint:disable-next-line:no-var-requires
const styles = require('./styles.tcss').default as Styles;

createTheme('a', {
    primaryColor: 'black',
    secondaryColor: 'orange',
});

createTheme('b', {
    primaryColor: 'pink',
    buttonColor: 'gray,'
});

const [defaultClass, classes] = styles.useTheme();
const [defaultClassA, classesA] = styles.useTheme('a');
const [defaultClassB, classesB] = styles.useTheme('b');
let currentClass = defaultClass;
let currentClasses = classes;

const root = document.createElement('div');
root.id = 'root';
document.body.appendChild(root);
const container = document.createElement('div');
container.id = 'container';
root.appendChild(container);
const span = document.createElement('span');
span.innerText = 'span';
container.appendChild(span);
const a = document.createElement('div');
a.id = 'a';
a.appendChild(document.createTextNode('a'));
const ab = document.createElement('div');
ab.id = 'ab';
ab.appendChild(document.createTextNode('ab'));
const btnReset = document.createElement('button');
btnReset.id = 'btnReset';
btnReset.innerText = 'reset';
btnReset.addEventListener('click', () => {
    currentClass = defaultClass;
    currentClasses = classes;
    setStyle();
});
const btnA = document.createElement('button');
btnA.id = 'btnA';
btnA.innerText = 'a';
btnA.addEventListener('click', () => {
    currentClass = defaultClassA;
    currentClasses = classesA;
    setStyle();
});
const btnB = document.createElement('button');
btnB.id = 'btnB';
btnB.innerText = 'b';
btnB.addEventListener('click', () => {
    currentClass = defaultClassB;
    currentClasses = classesB;
    setStyle();
});
container.appendChild(a);
container.appendChild(ab);
container.appendChild(btnReset);
container.appendChild(btnA);
container.appendChild(btnB);
function setStyle() {
    root.setAttribute('class', currentClass);
    a.setAttribute('class', currentClasses.a);
    ab.setAttribute('class', `${currentClasses.a} ${currentClasses.b}`);
}
setStyle();
