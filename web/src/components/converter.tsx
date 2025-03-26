import React, { useState, useEffect } from 'react';
import { IPv6PoetryConverter } from '../lib/ipv6poetry';

export default function Converter() {
  const [ipv6Address, setIpv6Address] = useState('2001:db8::1');
  const [poeticPhrase, setPoeticPhrase] = useState('');
  const [error, setError] = useState('');
  const [converter, setConverter] = useState<IPv6PoetryConverter | null>(null);
  const [direction, setDirection] = useState<'to-poetry' | 'to-ipv6'>('to-poetry');
  const [isLoading, setIsLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState<string>("0%");
  const [includeChecksum, setIncludeChecksum] = useState(true);

  // Initialize the converter
  useEffect(() => {
    const initConverter = async () => {
      try {
        // Load the wordlist from the server
        setIsLoading(true);
        setLoadingProgress("0%");
        const newConverter = await IPv6PoetryConverter.fromUrl(
          '/wordlists/wordlist.txt',
          includeChecksum,
          (progress) => setLoadingProgress(progress)
        );
        setConverter(newConverter);
        setIsLoading(false);
        
        // Initialize with an example conversion
        if (direction === 'to-poetry') {
          setPoeticPhrase(newConverter.addressToPoetry(ipv6Address));
        }
      } catch (err) {
        setError('Failed to initialize converter: ' + (err as Error).message);
        console.error('Error initializing converter:', err);
        setIsLoading(false);
      }
    };

    initConverter();
  }, [includeChecksum]);

  // Handle conversion
  const handleConvert = () => {
    if (!converter) return;
    
    setError('');
    try {
      if (direction === 'to-poetry') {
        const phrase = converter.addressToPoetry(ipv6Address);
        setPoeticPhrase(phrase);
      } else { // to-ipv6
        const address = converter.poetryToAddress(poeticPhrase);
        setIpv6Address(address);
      }
    } catch (err) {
      setError((err as Error).message);
    }
  };

  // Handle switch direction
  const toggleDirection = () => {
    setDirection(direction === 'to-poetry' ? 'to-ipv6' : 'to-poetry');
    setError('');
  };

  // Handle checksum toggle
  const toggleChecksum = () => {
    setIncludeChecksum(!includeChecksum);
  };

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (name === 'ipv6') {
      setIpv6Address(value);
    } else if (name === 'poetry') {
      setPoeticPhrase(value);
    }
  };

  return (
    <div className="converter">
      <h2>IPv6 Poetry Converter</h2>
      
      {isLoading ? (
        <div className="loading-container">
          <p>Loading wordlist... {loadingProgress}</p>
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{ width: loadingProgress }}
            ></div>
          </div>
        </div>
      ) : (
        <>
          <div className="direction-toggle">
            <button 
              className={`toggle-btn ${direction === 'to-poetry' ? 'active' : ''}`}
              onClick={toggleDirection}
            >
              IPv6 → Poetry
            </button>
            <button 
              className={`toggle-btn ${direction === 'to-ipv6' ? 'active' : ''}`}
              onClick={toggleDirection}
            >
              Poetry → IPv6
            </button>
          </div>

          <div className="conversion-form">
            {direction === 'to-poetry' ? (
              <>
                <div className="input-group">
                  <label htmlFor="ipv6-input">IPv6 Address:</label>
                  <input
                    id="ipv6-input"
                    name="ipv6"
                    type="text"
                    value={ipv6Address}
                    onChange={handleInputChange}
                    placeholder="Enter an IPv6 address (e.g., 2001:db8::1)"
                  />
                </div>
                
                <div className="options-group">
                  <label>
                    <input 
                      type="checkbox"
                      checked={includeChecksum}
                      onChange={toggleChecksum}
                    />
                    Include checksum word (9th word for error detection)
                  </label>
                </div>
                
                <button className="convert-btn" onClick={handleConvert}>
                  Convert to Poetry
                </button>
                
                <div className="result-group">
                  <label>Poetic Phrase:</label>
                  <div className="result-text">{poeticPhrase}</div>
                </div>
              </>
            ) : (
              <>
                <div className="input-group">
                  <label htmlFor="poetry-input">Poetic Phrase:</label>
                  <textarea
                    id="poetry-input"
                    name="poetry"
                    value={poeticPhrase}
                    onChange={handleInputChange}
                    placeholder="Enter a poetic phrase (8 or 9 words separated by spaces)"
                    rows={3}
                  />
                </div>
                
                <div className="options-group">
                  <label>
                    <input 
                      type="checkbox"
                      checked={includeChecksum}
                      onChange={toggleChecksum}
                    />
                    Verify checksum (if 9th word is present)
                  </label>
                </div>
                
                <button className="convert-btn" onClick={handleConvert}>
                  Convert to IPv6
                </button>
                
                <div className="result-group">
                  <label>IPv6 Address:</label>
                  <div className="result-text">{ipv6Address}</div>
                </div>
              </>
            )}
            
            {error && <div className="error-message">{error}</div>}
          </div>

          <div className="converter-info">
            <p>
              <strong>How it works:</strong> IPv6 addresses are converted to sequences of 8 words,
              with each word representing a 16-bit segment of the address.
            </p>
            <p>
              <strong>Checksum:</strong> The 9th word acts as a checksum for error detection, generated
              using a CRC32 hash of all 8 segments.
            </p>
            <p>
              <strong>Note:</strong> This web converter uses the same wordlist and algorithm as the 
              Python implementation, so results will be consistent across platforms.
            </p>
          </div>
        </>
      )}
      
      <style>{`
        .converter {
          background-color: #f5f5f5;
          border-radius: 8px;
          padding: 20px;
          margin: 20px 0;
          max-width: 600px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }
        
        .converter h2 {
          margin-top: 0;
          color: #333;
        }
        
        .direction-toggle {
          display: flex;
          margin-bottom: 20px;
          border-radius: 4px;
          overflow: hidden;
        }
        
        .toggle-btn {
          flex: 1;
          background-color: #e0e0e0;
          border: none;
          padding: 10px;
          cursor: pointer;
          transition: background-color 0.3s;
        }
        
        .toggle-btn.active {
          background-color: #007bff;
          color: white;
        }
        
        .input-group, .result-group, .options-group {
          margin-bottom: 15px;
        }
        
        .input-group label, .result-group label {
          display: block;
          margin-bottom: 5px;
          font-weight: bold;
        }
        
        .options-group label {
          display: flex;
          align-items: center;
          font-size: 14px;
          color: #555;
        }
        
        .options-group input[type="checkbox"] {
          margin-right: 8px;
          width: auto;
        }
        
        input, textarea {
          width: 100%;
          padding: 8px;
          border: 1px solid #ccc;
          border-radius: 4px;
          font-size: 16px;
        }
        
        .convert-btn {
          background-color: #28a745;
          color: white;
          border: none;
          padding: 10px 15px;
          border-radius: 4px;
          cursor: pointer;
          font-size: 16px;
          margin: 10px 0;
        }
        
        .result-text {
          padding: 10px;
          background-color: #fff;
          border: 1px solid #ddd;
          border-radius: 4px;
          min-height: 24px;
          word-break: break-all;
        }
        
        .error-message {
          color: #dc3545;
          margin-top: 10px;
          padding: 8px;
          background-color: #f8d7da;
          border-radius: 4px;
          border: 1px solid #f5c6cb;
        }
        
        .converter-info {
          margin-top: 20px;
          padding-top: 15px;
          border-top: 1px solid #ddd;
          font-size: 14px;
        }
        
        .important-note {
          margin-top: 15px;
          padding: 10px;
          background-color: #fff3cd;
          border: 1px solid #ffeeba;
          border-radius: 4px;
          color: #856404;
        }
        
        .code-example {
          background-color: #f8f9fa;
          padding: 8px;
          border-radius: 4px;
          border: 1px solid #e9ecef;
          color: #333;
          font-family: 'Source Code Pro', monospace;
          margin: 8px 0;
        }
        
        .loading-container {
          text-align: center;
          padding: 2rem;
        }
        
        .progress-bar {
          width: 100%;
          height: 8px;
          background-color: #e9ecef;
          border-radius: 4px;
          margin: 1rem 0;
          overflow: hidden;
        }
        
        .progress-fill {
          height: 100%;
          background-color: var(--primary-color);
          transition: width 0.3s ease;
        }
      `}</style>
    </div>
  );
}