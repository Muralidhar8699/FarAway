import { useState } from "react";
import "./App.css";
import Form from "./components/Form";
import PackingList from "./components/PackingList";
import Stats from "./components/Stats";
import Logo from "./components/logo";

function App() {
  const [items, setItems] = useState([]);
  // const handleAddItems = (item) => {
  // setItems((items) => [...items, item]);
  // };

  const handleDelete = (id) => {
    setItems((items) => items.filter((item) => item.id !== id));
  };
  const handleToggle = (id) => {
    setItems((items) =>
      items.map((item) =>
        item.id === id ? { ...item, packed: !item.packed } : item
      )
    );
  };
  const handleClear = () => {
    const confirmed = window.confirm('Are you shure you want to delete this List')
    if(confirmed)setItems([])
  };
  return (
    <div className="App">
      <Logo />
      <Form setItems={setItems} />{" "}
      {/* handleAddItems ={handleAddItems} optional method */}
      <PackingList
        items={items}
        handleDelete={handleDelete}
        handleToggle={handleToggle}
        handleClear={handleClear}
      />
      <Stats items={items} />
    </div>
  );
}

export default App;
