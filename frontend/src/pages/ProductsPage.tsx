import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ProductCard } from '../components/ProductCard';
import { QuickViewModal } from '../components/QuickViewModal';
import { Product } from '../types';

const CATEGORIES = ['All', 'Electronics', 'Clothing', 'Books', 'Accessories', 'Home', 'InvalidCat'];

export const ProductsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const currentCategory = searchParams.get('category') || 'All';
  const currentSort = searchParams.get('sort') || 'default';
  const currentPage = parseInt(searchParams.get('page') || '1');

  const [products, setProducts] = useState<Product[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [minPriceInput, setMinPriceInput] = useState('');
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);

    let url = `/api/products?page=${currentPage}&limit=8`;
    if (currentCategory !== 'All') {
      url += `&category=${encodeURIComponent(currentCategory)}`;
    }
    if (currentSort !== 'default') {
      url += `&sort=${currentSort}`;
    }
    if (minPriceInput) {
      url += `&minPrice=${minPriceInput}`; // BUG-019: Passes string abc directly
    }

    fetch(url)
      .then((res) => {
        if (!res.ok) {
          throw new Error(`HTTP Error ${res.status}: Failed to load catalog products`);
        }
        return res.json();
      })
      .then((data) => {
        if (data.products) {
          setProducts(data.products);
          setTotalPages(data.totalPages || 1);
        }
        setLoading(false);
      })
      .catch((err) => {
        // BUG-073: Error handling bug - Category InvalidCat displays blank generic error
        setError(err.message);
        setLoading(false);
      });
  }, [currentCategory, currentSort, currentPage, minPriceInput]);

  const handleCategoryChange = (cat: string) => {
    searchParams.set('category', cat);
    searchParams.set('page', '1');
    setSearchParams(searchParams);
  };

  const handleSortChange = (sort: string) => {
    searchParams.set('sort', sort);
    setSearchParams(searchParams);
  };

  const handlePageChange = (newPage: number) => {
    searchParams.set('page', newPage.toString());
    setSearchParams(searchParams);
  };

  if (error) {
    return (
      <div className="container page-wrapper" style={{ textAlign: 'center', paddingTop: '60px' }}>
        {/* BUG-073: Displays blank error block without fallback products */}
        <div className="error-alert" style={{ maxWidth: '600px', margin: '0 auto' }}>
          <h3>Catalog Failed to Load</h3>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container page-wrapper">
      <h1 className="section-title">Product Catalog</h1>

      {/* Filter and Control Bar */}
      <div style={{ background: 'white', padding: '20px', borderRadius: '12px', border: '1px solid var(--border)', marginBottom: '30px', display: 'flex', flexWrap: 'wrap', gap: '20px', alignItems: 'center', justifyContent: 'space-between' }}>
        {/* Category Pills */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => handleCategoryChange(cat)}
              style={{
                padding: '6px 14px',
                borderRadius: '20px',
                fontSize: '0.85rem',
                fontWeight: 600,
                background: currentCategory === cat ? 'var(--primary)' : '#f1f5f9',
                color: currentCategory === cat ? 'white' : 'var(--text-dark)'
              }}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Filters and Sorting */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {/* Min Price Filter Input */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Min Price (₹):</span>
            <input
              type="text"
              placeholder="e.g. 1000"
              value={minPriceInput}
              onChange={(e) => setMinPriceInput(e.target.value)}
              style={{ width: '90px', padding: '6px 10px', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '0.85rem' }}
            />
          </div>

          {/* Sort Dropdown */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Sort By:</span>
            <select
              value={currentSort}
              onChange={(e) => handleSortChange(e.target.value)}
              style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '0.85rem' }}
            >
              <option value="default">Featured</option>
              <option value="price_asc">Price: Low to High</option> {/* BUG-003 */}
              <option value="price_desc">Price: High to Low</option>
              <option value="rating">Highest Rated</option>
            </select>
          </div>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px' }}>
          <p style={{ color: 'var(--text-muted)' }}>Loading products catalog...</p>
        </div>
      ) : (
        <>
          <div className="product-grid">
            {products.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onQuickView={(p) => setQuickViewProduct(p)}
              />
            ))}
          </div>

          {/* Pagination Controls */}
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '12px', marginTop: '40px' }}>
            <button
              disabled={currentPage <= 1}
              onClick={() => handlePageChange(currentPage - 1)}
              className="btn-secondary"
              style={{ padding: '6px 14px', opacity: currentPage <= 1 ? 0.5 : 1 }}
            >
              Previous
            </button>
            
            <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>
              Page {currentPage} of {totalPages}
            </span>

            {/* BUG-004: Page 2 skips product #10 due to backend off-by-one logic */}
            <button
              disabled={currentPage >= totalPages}
              onClick={() => handlePageChange(currentPage + 1)}
              className="btn-secondary"
              style={{ padding: '6px 14px', opacity: currentPage >= totalPages ? 0.5 : 1 }}
            >
              Next
            </button>
          </div>
        </>
      )}

      <QuickViewModal
        product={quickViewProduct}
        onClose={() => setQuickViewProduct(null)}
      />
    </div>
  );
};
