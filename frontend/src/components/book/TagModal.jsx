import React from 'react';

const TagModal = ({ availableTags, handleTagSelection, closeModal }) => (
  <div className="modal tag-modal">
    <div className="modal-content">
      <h3>Select Book Tag</h3>
      <div className="tags-list">
        {availableTags.length > 0 ? (
          availableTags.map(tag => (
            <div key={tag.id} className="tag-item">
              <label>
                <input
                  type="checkbox"
                  onChange={() => handleTagSelection(tag.name)}
                />
                {tag.name}
              </label>
            </div>
          ))
        ) : (
          <p>No tags available. Create a new tag instead.</p>
        )}
      </div>
      <div className="modal-actions">
        <button type="button" onClick={closeModal}>Close</button>
      </div>
    </div>
  </div>
);

export default TagModal;