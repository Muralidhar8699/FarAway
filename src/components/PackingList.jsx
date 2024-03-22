import React, { useState } from "react";

export default function PackingList({
  items,
  handleDelete,
  handleToggle,
  handleClear,
}) {
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
              <div className="checkbox-wrapper-12">
                <div className="cbx">
                  <input
                    className="cbx-12"
                    type="checkbox"
                    value={e.packed}
                    onChange={() => handleToggle(e.id)}
                  />
                  <label for="cbx-12"></label>
                  <svg width="15" height="14" viewbox="0 0 15 14" fill="none">
                    <path d="M2 8.36364L6.23077 12L13 2"></path>
                  </svg>
                </div>
                <svg xmlns="http://www.w3.org/2000/svg" version="1.1">
                  <defs>
                    <filter id="goo-12">
                      <fegaussianblur
                        in="SourceGraphic"
                        stddeviation="4"
                        result="blur"
                      ></fegaussianblur>
                      <fecolormatrix
                        in="blur"
                        mode="matrix"
                        values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 22 -7"
                        result="goo-12"
                      ></fecolormatrix>
                      <feblend in="SourceGraphic" in2="goo-12"></feblend>
                    </filter>
                  </defs>
                </svg>
              </div>
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
        <button onClick={handleClear} className="button-29">
          Clear List
        </button>
      </div>
    </section>
  );
}
