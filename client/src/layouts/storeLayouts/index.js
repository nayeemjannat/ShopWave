import ElectronicsLayout from './ElectronicsLayout';
import ClothingLayout from './ClothingLayout';
import BeautyLayout from './BeautyLayout';
import GroceryLayout from './GroceryLayout';
import DigitalLayout from './DigitalLayout';
import MultiLayout from './MultiLayout';

const LAYOUT_MAP = {
  electronics: ElectronicsLayout,
  clothing: ClothingLayout,
  beauty: BeautyLayout,
  grocery: GroceryLayout,
  digital: DigitalLayout,
  multi: MultiLayout,
};

export function getStoreLayout(storeType) {
  return LAYOUT_MAP[storeType] || MultiLayout;
}

export default getStoreLayout;
