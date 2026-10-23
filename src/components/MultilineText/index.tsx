import React from 'react';

/**
 * Renders user supplied text, turning newlines into <br /> elements.
 * Output is plain React nodes (escaped by React), never raw HTML, so user
 * content can not inject markup or scripts.
 */
export const renderMultiline = (text?: string | null): React.ReactNode[] => {
  const lines = String(text ?? '').split(/\r?\n/);
  return lines.flatMap((line, index) =>
    index === 0 ? [line] : [<br key={`br-${index}`} />, line],
  );
};

export default renderMultiline;
