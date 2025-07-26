import React, { useState } from 'react';

export const TestComponent: React.FC = () => {
  const [count, setCount] = useState(0);
  return <div onClick={() => setCount(count + 1)}>{count}</div>;
};
