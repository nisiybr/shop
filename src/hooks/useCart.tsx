import { createContext, ReactNode, useContext, useState } from 'react';
import { toast } from 'react-toastify';
import { isNotEmittedStatement } from 'typescript';
import { api } from '../services/api';
import { Product, Stock } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    // const storagedCart = Buscar dados do localStorage
    const storagedCart = localStorage.getItem('@RocketShoes:cart');

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  const addProduct = async (productId: number) => {
    try { 

      const responseStock = await api.get(`stock/${productId}`);
      const product = cart.filter(item => item.id === productId)
      if(product.length > 0) {
        if(product[0].amount + 1 > responseStock.data.amount) {
          toast.error('Quantidade solicitada fora de estoque');
          return;
        }
      }
      else {
        if( 1 > responseStock.data.amount) {
          toast.error('Quantidade solicitada fora de estoque');
          return;
        }
      }
      
           

      const { data } = await api.get(`products/${productId}`);

      if(data.lenght <= 0) {
        throw new Error();
      }
      
      let newCart:Product[] = [];

      if(cart.filter((item:Product) => item.id === productId).length > 0) {

        newCart = cart.map((item:Product) => {
            if(item.id === productId) {
              return {
                ...item,
                amount: item.amount+1,
              }
            }         
            return {
              ...item,              
            }
            
          } 
        )
      }
      else {
        const addItem:Product = {
          id: data.id,
          amount: 1,
          image: data.image,
          price: data.price,
          title: data.title
        }
        newCart = [...cart,addItem]
      }
      
      setCart(newCart);           

      localStorage.setItem('@RocketShoes:cart',JSON.stringify(newCart))
    } catch {
      toast.error('Erro na adição do produto');
    }
  };

  const removeProduct = (productId: number) => {
    try {
      if(cart.filter(item => item.id === productId).length === 0){
        throw new Error();
      }

      const newCart = cart.filter(item => item.id !== productId)      
      setCart(newCart); 
      localStorage.setItem('@RocketShoes:cart',JSON.stringify(newCart))
    } catch {
      toast.error('Erro na remoção do produto');
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {  
      if(amount<=0) {
        throw new Error();
      }         
      const responseStock = await api.get(`stock/${productId}`);
      if(amount > responseStock.data.amount) {
        toast.error('Quantidade solicitada fora de estoque'); 
        return;       
      }
      
      const newCart = cart.map((item:Product) => {
        if(item.id === productId) {
          return {
            ...item,
            amount: amount,
          }
        }         
        return {
          ...item,              
        }        
      })      
      setCart(newCart);

      localStorage.setItem('@RocketShoes:cart',JSON.stringify(newCart))

    } catch {
      toast.error('Erro na alteração de quantidade do produto');
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
