import React, { useState } from "react";

export default function Form({ setItems }) {
  const [desc, setDesc] = useState("");
  const [quant, setQuant] = useState(1);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!desc) return;
    let newItem = {
      desc,
      quant,
      packed: false,
      id: Date.now(),
    };
    console.log(newItem);
    // handleAddItems(newItem)
    setDesc("");
    setQuant(1);
    setItems((items) => [...items, newItem]);
  };
  return (
    <form className="form_div" onSubmit={handleSubmit}>
      <h3 className="form_h3">What do you need for your 🤩 Trip?</h3>
      <select onChange={(e) => setQuant(Number(e.target.value))} value={quant}>
        {Array.from({ length: 20 }, (_, i) => i + 1).map((num) => (
          <option value={num} key={num}>
            {num}
          </option>
        ))}
      </select>
      <input
        className="form_input"
        type="text"
        placeholder="Item..."
        value={desc}
        onChange={(e) => setDesc(e.target.value)}
      />
      <button class="button-29" role="button">
        add
      </button>
    </form>
  );
}
