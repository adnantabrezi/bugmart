import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ProductCard } from '../components/ProductCard';
import { Product } from '../types';
import { Search } from 'lucide-react';

export const SearchPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get('q') || '';

  const [inputVal, setInputVal] = useState(query);
  const [results, setResults] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // BUG-063: Fires API search request on EVERY SINGLE KEYSTROKE without debounce!
  useEffect(() => {
    if (!inputVal) {
      setResults([]);
      return;
    }

    setLoading(true);
    setError(null);

    // BUG-018: Special character % or ? causes unescaped backend URIError / 500
    fetch(`/api/products?search=${inputVal}`)
      .then((res) => {
        if (!res.ok) {
          throw new Error('Search failed: Invalid query characters');
        }
        return res.json();
      })
      .then((data) => {
        if (data.products) {
          setResults(data.products);
        }
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [inputVal]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInputVal(val);
    searchParams.set('q', val);
    setSearchParams(searchParams);
  };

  return (
    <div className="container page-wrapper">
      <h1 className="section-title">Search Products</h1>

      <div style={{ maxWidth: '600px', margin: '0 auto 40px auto', position: 'relative' }}>
        <input
          type="text"
          className="form-input"
          style={{ padding: '14px 44px 14px 20px', borderRadius: '30px', fontSize: '1rem' }}
          placeholder="Search product names..."
          value={inputVal}
          onChange={handleInputChange} // BUG-063: Un-debounced keystroke API triggers
        />
        <Search style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
      </div>

      {error ? (
        <div className="error-alert" style={{ maxWidth: '600px', margin: '0 auto', textAlign: 'center' }}>
          {error}
        </div>
      ) : loading ? (
        <p style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Searching catalog...</p>
      ) : results.length > 0 ? (
        <div className="product-grid">
          {results.map((prod) => (
            <ProductCard key={prod.id} product={prod} />
          ))}
        </div>
      ) : inputVal ? (
        <p style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No products found matching "{inputVal}"</p>
      ) : (
        <p style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Type above to search our catalog</p>
      )}
    </div>
  );
};
