import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { BASE_URL } from '../../../utils/api';
import { useNavigate } from 'react-router-dom';

const PinReasonModal = ({ show, onClose, onConfirm }) => {
  const [pin, setPin] = useState('');
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const inputRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (show && inputRef.current) {
      inputRef.current.focus();
    }
  }, [show]);

  const handleConfirm = () => {
    if (pin.trim() !== '1234') {
      setError('❌ Invalid PIN');
      return;
    }

    if (!reason) {
      setError('⚠️ Please select a reason');
      return;
    }

    onConfirm({ pin, reason }); // pass selected reason to parent
    handleClose();
  };

  const handleClose = () => {
    setPin('');
    setReason('');
    setError('');
    onClose(); // call parent's close handler
  };

  if (!show) return null;

  return (
    <div className="modal-backdrop d-flex justify-content-center align-items-center">
      <div className="modal-content bg-white p-4 rounded shadow" style={{ maxWidth: 400, width: '100%' }}>
        <h5 className="mb-3 text-center">🔒 Enter PIN & Reason</h5>

        <div className="mb-3">
          <label className="form-label">PIN</label>
          <input
            type="password"
            ref={inputRef}
            className="form-control"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            placeholder="Enter 4-digit PIN"
            maxLength={4}
          />
        </div>

        <div className="mb-3">
          <label className="form-label">Reason</label>
          <select
            className="form-select"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          >
            <option value="">Select a reason</option>
            <option value="Out of stock">Out of stock</option>
            <option value="Replaced with another item">Replaced with another item</option>
            <option value="Customer changed mind">Customer changed mind</option>
            <option value="Wrong order placed">Wrong order placed</option>
          </select>
        </div>

        {error && <div className="text-danger mb-3">{error}</div>}

        <div className="d-flex justify-content-between">
          <button className="btn btn-secondary w-45" onClick={handleClose}>Cancel</button>
          <button className="btn btn-primary w-45" onClick={handleConfirm}>Confirm</button>
        </div>
      </div>
    </div>
  );
};

export default PinReasonModal;