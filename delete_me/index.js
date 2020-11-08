const App = function _App() {
  return `
    <h1>Hello Vanilla JS!</h1>
    <div>
      Example of state management in Vanilla JS
    </div>
    <br />
    <h1>${_App.state.count}</h1>
    <button id="button">Increase</button>
  `;
};

App.state = {
  count: 0,
  increment: () => {
    App.state.count++;
    updateTree();
  }
};

const updateTree = () => {
  document.getElementById("app").innerHTML = App();
  document
    .getElementById("button")
    .addEventListener("click", App.state.increment);
};

updateTree();