import { useEffect, useState } from 'react';
import { UserNavbar } from '../components/UserNavbar';
import { Card, CardBody } from '../components/Card';
import { Button } from '../components/Button';
import { ShoppingCart, Plus, Minus, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { getApiUrl, getAssetUrl } from '../utils/apiConfig';

export function Souvenirs() {
  const [cart, setCart] = useState<{ [key: number]: number }>({});
  const [showCart, setShowCart] = useState(false);
  const [products, setProducts] = useState<any[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [productError, setProductError] = useState('');

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch(getApiUrl('/api/souvenirs'));
        if (!response.ok) throw new Error('Failed to load souvenirs');
        const data = await response.json();
        setProducts(data);
      } catch (err) {
        setProductError((err as Error).message || 'Unable to load souvenirs');
      } finally {
        setLoadingProducts(false);
      }
    };

    fetchProducts();
  }, []);

  const addToCart = (productId: number) => {
    setCart({ ...cart, [productId]: (cart[productId] || 0) + 1 });
    toast.success('Added to cart');
  };

  const updateQuantity = (productId: number, quantity: number) => {
    if (quantity <= 0) {
      const newCart = { ...cart };
      delete newCart[productId];
      setCart(newCart);
    } else {
      setCart({ ...cart, [productId]: quantity });
    }
  };

  const getTotalItems = () => {
    return Object.values(cart).reduce((sum, qty) => sum + qty, 0);
  };

  const getTotalPrice = () => {
    return Object.entries(cart).reduce((sum, [id, qty]) => {
      const product = products.find(p => p.id === parseInt(id));
      return sum + (product?.price || 0) * qty;
    }, 0);
  };

  const handleCheckout = () => {
    toast.success('Order placed! Please proceed to payment.');
    setCart({});
    setShowCart(false);
  };

  return (
    <div className="min-h-screen">
      <UserNavbar />

      <div className="max-w-7xl mx-auto p-6">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 flex items-center justify-between"
        >
          <div>
            <h1 className="text-primary mb-2">Souvenir Shop</h1>
            <p className="text-muted-foreground">Browse our collection of religious items</p>
          </div>
          <Button onClick={() => setShowCart(!showCart)} className="relative">
            <ShoppingCart className="w-5 h-5 mr-2" />
            Cart
            {getTotalItems() > 0 && (
              <span className="absolute -top-2 -right-2 bg-accent text-white w-6 h-6 rounded-full flex items-center justify-center text-sm">
                {getTotalItems()}
              </span>
            )}
          </Button>
        </motion.div>

        {loadingProducts ? (
          <div className="text-center text-muted-foreground">Loading souvenirs...</div>
        ) : productError ? (
          <div className="text-center text-destructive">{productError}</div>
        ) : products.length === 0 ? (
          <div className="text-center text-muted-foreground">No souvenirs found in the database.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((product, index) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
              <Card hover>
                <div className="aspect-square overflow-hidden">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <CardBody>
                  <h3 className="mb-2">{product.name}</h3>
                  <p className="text-sm text-muted-foreground mb-4">{product.description}</p>
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-bold text-primary text-xl">₱{product.price.toLocaleString()}</span>
                    <span className="text-sm text-muted-foreground">
                      Stock: {product.stock}
                    </span>
                  </div>
                  {cart[product.id] ? (
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => updateQuantity(product.id, cart[product.id] - 1)}
                      >
                        <Minus className="w-4 h-4" />
                      </Button>
                      <span className="flex-1 text-center font-medium">{cart[product.id]}</span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => updateQuantity(product.id, cart[product.id] + 1)}
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                  ) : (
                    <Button onClick={() => addToCart(product.id)} className="w-full">
                      <ShoppingCart className="w-4 h-4 mr-2" />
                      Add to Cart
                    </Button>
                  )}
                </CardBody>
              </Card>
            </motion.div>
          ))}
          </div>
        )}

        {/* Shopping Cart Sidebar */}
        <AnimatePresence>
          {showCart && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/50 z-40"
                onClick={() => setShowCart(false)}
              />
              <motion.div
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', damping: 25 }}
                className="fixed right-0 top-0 h-full w-full max-w-md bg-card shadow-2xl z-50 flex flex-col"
              >
                <div className="p-6 border-b border-border">
                  <h2>Shopping Cart</h2>
                </div>

                <div className="flex-1 overflow-y-auto p-6">
                  {getTotalItems() === 0 ? (
                    <div className="text-center py-12">
                      <ShoppingCart className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">Your cart is empty</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {Object.entries(cart).map(([id, quantity]) => {
                        const product = products.find(p => p.id === parseInt(id));
                        if (!product) return null;

                        return (
                          <div key={id} className="flex gap-4 p-4 bg-secondary/30 rounded-lg">
                            <img
                              src={product.image}
                              alt={product.name}
                              className="w-20 h-20 object-cover rounded-lg"
                            />
                            <div className="flex-1">
                              <h4 className="mb-1">{product.name}</h4>
                              <p className="text-primary font-medium">₱{product.price.toLocaleString()}</p>
                              <div className="flex items-center gap-2 mt-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => updateQuantity(product.id, quantity - 1)}
                                >
                                  <Minus className="w-3 h-3" />
                                </Button>
                                <span className="text-sm">{quantity}</span>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => updateQuantity(product.id, quantity + 1)}
                                >
                                  <Plus className="w-3 h-3" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => updateQuantity(product.id, 0)}
                                  className="ml-auto text-destructive"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {getTotalItems() > 0 && (
                  <div className="p-6 border-t border-border">
                    <div className="flex justify-between mb-4">
                      <span className="font-medium">Total:</span>
                      <span className="font-bold text-primary text-xl">
                        ₱{getTotalPrice().toLocaleString()}
                      </span>
                    </div>
                    <Button onClick={handleCheckout} className="w-full">
                      Proceed to Checkout
                    </Button>
                  </div>
                )}
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
