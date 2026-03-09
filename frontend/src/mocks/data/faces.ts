import { FeaturedFace } from '../../types';
import { FACES_OF_THE_YEAR as INITIAL_FACES } from '../../constants';

export let mockFaces: FeaturedFace[] = INITIAL_FACES.map((f, i) => ({
  ...f,
  id: i.toString(),
  content: 'Gương mặt sinh viên xuất sắc tiêu biểu của nhà trường.'
}));

export const updateMockFaces = (newFaces: FeaturedFace[]) => {
  mockFaces = newFaces;
};
