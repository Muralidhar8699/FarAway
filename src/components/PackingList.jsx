import React, { useState } from "react";

export default function PackingList({ items, handleDelete, handleToggle,handleClear }) {
  const [sortBy, setSortBy] = useState("input");
  let sortedItems;
  if (sortBy === "input") sortedItems = items;
  if (sortBy === "description")
    sortedItems = items.slice().sort((a, b) => a.desc.localeCompare(b.desc));
  if (sortBy === "packed")
    sortedItems = items
      .slice()
      .sort((a, b) => Number(a.packed) - Number(b.packed));
  return (
    <section className="list_main">
      <div className="packinglist_div">
        {sortedItems?.map((e, i) => {
          return (
            <div className="list_card" key={i}>
              <input
                type="checkbox"
                value={e.packed}
                onChange={() => handleToggle(e.id)}
              />
              <p>{e.quant}</p>
              <p style={e.packed ? { textDecoration: "line-through" } : {}}>
                {e.desc}
              </p>
              <button onClick={() => handleDelete(e.id)}>❌</button>
            </div>
          );
        })}
      </div>
      <div className="list_sort_div">
        <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
          <option value="input">Sort by input Order</option>
          <option value="description">Sort by description</option>
          <option value="packed">Sort by packed status</option>
        </select>
        <button onClick={handleClear} className="form_add">Clear List</button>
      </div>
    </section>
  );
}
