import React, {
  useEffect,
  useState,
  useCallback,
  useMemo,
  useLayoutEffect,
} from 'react';
import { Image } from 'react-native';

import Icon from 'react-native-vector-icons/Feather';
import MaterialIcon from 'react-native-vector-icons/MaterialIcons';
import { useNavigation, useRoute } from '@react-navigation/native';
import formatValue from '../../utils/formatValue';

import api from '../../services/api';

import {
  Container,
  Header,
  ScrollContainer,
  FoodsContainer,
  Food,
  FoodImageContainer,
  FoodContent,
  FoodTitle,
  FoodDescription,
  FoodPricing,
  AdditionalsContainer,
  Title,
  TotalContainer,
  AdittionalItem,
  AdittionalItemText,
  AdittionalQuantity,
  PriceButtonContainer,
  TotalPrice,
  QuantityContainer,
  FinishOrderButton,
  ButtonText,
  IconContainer,
} from './styles';

interface Params {
  id: number;
}

interface Extra {
  id: number;
  name: string;
  value: number;
  quantity: number;
}

interface Food {
  id: number;
  name: string;
  description: string;
  price: number;
  image_url: string;
  formattedPrice: string;
  extras: Extra[];
}

const FoodDetails: React.FC = () => {
  const [food, setFood] = useState({} as Food);
  const [extras, setExtras] = useState<Extra[]>([]);
  const [isFavorite, setIsFavorite] = useState(false);
  const [foodQuantity, setFoodQuantity] = useState(1);

  const navigation = useNavigation();
  const route = useRoute();

  const routeParams = route.params as Params;

  useEffect(() => {
    async function loadFood(): Promise<void> {
      const { id } = routeParams;

      const { data } = await api.get<Food>(`/foods/${id}`);

      const foodExtras = data.extras.map((extras) => ({
        ...extras,
        quantity: 0,
      }));
      setExtras(foodExtras);

      const formattedFoodData = {
        ...data,
        formattedPrice: formatValue(data.price),
        extras: foodExtras,
      };
      setFood(formattedFoodData);
    }

    loadFood();
  }, [routeParams]);

  function handleIncrementExtra(id: number): void {
    const extrasUpdated = extras.map(({ id: extraId, quantity, ...rest }) => ({
      ...rest,
      id: extraId,
      quantity: extraId === id ? quantity + 1 : quantity,
    }));

    setExtras(extrasUpdated);
  }

  function handleDecrementExtra(id: number): void {
    const extrasUpdated = extras.map(({ id: extraId, quantity, ...rest }) => ({
      ...rest,
      id: extraId,
      quantity: extraId === id && quantity > 0 ? quantity - 1 : quantity,
    }));

    setExtras(extrasUpdated);
  }

  function handleIncrementFood(): void {
    setFoodQuantity((oldFoodQuantity) => oldFoodQuantity + 1);
  }

  function handleDecrementFood(): void {
    setFoodQuantity((oldFoodQuantity) =>
      oldFoodQuantity > 1 ? oldFoodQuantity - 1 : oldFoodQuantity,
    );
  }

  const toggleFavorite = useCallback(() => {
    async function setFoodFavorite(): Promise<void> {
      const foodFavorited = {
        ...food,
        extras: undefined,
      };

      await api.post('/favorites', foodFavorited);
    }
    async function setFoodNotFavorite(): Promise<void> {
      await api.delete(`/favorites/${food.id}`);
    }

    setIsFavorite(!isFavorite);
    if (isFavorite) setFoodNotFavorite();
    if (!isFavorite) setFoodFavorite();
  }, [isFavorite, food]);

  const cartTotal = useMemo(() => {
    const extrasTotal = extras.reduce(
      (total, { quantity, value }) => total + quantity * value,
      0,
    );

    const productTotal = food.price * foodQuantity;

    return formatValue(extrasTotal + productTotal);
  }, [extras, food, foodQuantity]);

  async function handleFinishOrder(): Promise<void> {
    const orderData = {
      product_id: food.id,
      ...food,
      extras,
      price: Number(cartTotal.slice(2).replace(',', '.')),
      id: `${food.id}-${Date.now()}`,
    };

    await api.post('/orders', orderData);
    navigation.navigate('MainBottom', {
      screen: 'Orders',
    });
  }

  // Calculate the correct icon name
  const favoriteIconName = useMemo(
    () => (isFavorite ? 'favorite' : 'favorite-border'),
    [isFavorite],
  );

  useLayoutEffect(() => {
    // Add the favorite icon on the right of the header bar
    navigation.setOptions({
      headerRight: () => (
        <MaterialIcon
          name={favoriteIconName}
          size={24}
          color="#FFB84D"
          onPress={() => toggleFavorite()}
        />
      ),
    });
  }, [navigation, favoriteIconName, toggleFavorite]);

  return (
    <Container>
      <Header />

      <ScrollContainer>
        <FoodsContainer>
          <Food>
            <FoodImageContainer>
              <Image
                style={{ width: 327, height: 183 }}
                source={{
                  uri: food.image_url,
                }}
              />
            </FoodImageContainer>
            <FoodContent>
              <FoodTitle>{food.name}</FoodTitle>
              <FoodDescription>{food.description}</FoodDescription>
              <FoodPricing>{food.formattedPrice}</FoodPricing>
            </FoodContent>
          </Food>
        </FoodsContainer>
        <AdditionalsContainer>
          <Title>Adicionais</Title>
          {extras.map((extra) => (
            <AdittionalItem key={extra.id}>
              <AdittionalItemText>{extra.name}</AdittionalItemText>
              <AdittionalQuantity>
                <Icon
                  size={15}
                  color="#6C6C80"
                  name="minus"
                  onPress={() => handleDecrementExtra(extra.id)}
                  testID={`decrement-extra-${extra.id}`}
                />
                <AdittionalItemText testID={`extra-quantity-${extra.id}`}>
                  {extra.quantity}
                </AdittionalItemText>
                <Icon
                  size={15}
                  color="#6C6C80"
                  name="plus"
                  onPress={() => handleIncrementExtra(extra.id)}
                  testID={`increment-extra-${extra.id}`}
                />
              </AdittionalQuantity>
            </AdittionalItem>
          ))}
        </AdditionalsContainer>
        <TotalContainer>
          <Title>Total do pedido</Title>
          <PriceButtonContainer>
            <TotalPrice testID="cart-total">{cartTotal}</TotalPrice>
            <QuantityContainer>
              <Icon
                size={15}
                color="#6C6C80"
                name="minus"
                onPress={handleDecrementFood}
                testID="decrement-food"
              />
              <AdittionalItemText testID="food-quantity">
                {foodQuantity}
              </AdittionalItemText>
              <Icon
                size={15}
                color="#6C6C80"
                name="plus"
                onPress={handleIncrementFood}
                testID="increment-food"
              />
            </QuantityContainer>
          </PriceButtonContainer>

          <FinishOrderButton onPress={() => handleFinishOrder()}>
            <ButtonText>Confirmar pedido</ButtonText>
            <IconContainer>
              <Icon name="check-square" size={24} color="#fff" />
            </IconContainer>
          </FinishOrderButton>
        </TotalContainer>
      </ScrollContainer>
    </Container>
  );
};

export default FoodDetails;
