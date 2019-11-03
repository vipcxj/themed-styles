# react-nice-bubble &middot; ![GitHub license](https://img.shields.io/badge/license-MIT-blue.svg) [![npm version](https://img.shields.io/npm/v/react-nice-bubble.svg?style=flat)](https://www.npmjs.com/package/react-nice-bubble)

The powerful bubble component for [React](https://reactjs.org/) which support transparent background and border.

# key features

- support background color with alpha.
- support border color with alpha.
- support custom border width.
- support custom border radius.
- support custom border color.
- support custom background color.
- support custom bubble width.
- support custom bubble height.
- support 12 arrow position.
- support custom arrow shape.
- support box-sizing.

## Installation

Using [npm](https://www.npmjs.com/):

    $ npm install --save react-nice-bubble
    
## Demo

[storybook](https://vipcxj.github.io/react-nice-bubble/)

## Example
    
```jsx
import React from 'react';
import Bubble, { BoxSizing, Position } from 'react-nice-bubble';

const App = (
  <Bubble
     width={300}
     height={300}
     arrowSize={16}
     arrowDegree0={45}
     arrowDegree1={45}
     arrowOffset={16}
     position={Position.TOP_LEFT}
     borderWidth={1}
     borderColor="black"
     borderRadius={0}
     boxSizing={BoxSizing.CONTENT_BOX}
     backgroundColor="white"
  >
     Hello world!
  </Bubble>
);

const root = document.getElementById('root');
ReactDOM.render(<App />, root);

```

## Props

WIP
