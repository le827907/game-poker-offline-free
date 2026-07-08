function getAvatarProps(seed) {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  }
  const colors = ['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#eab308'];
  const shapes = ['circle', 'square', 'triangle', 'diamond'];
  
  const colorIndex = Math.abs(hash) % colors.length;
  const shapeIndex = Math.abs(hash >> 3) % shapes.length;
  
  return { color: colors[colorIndex], shape: shapes[shapeIndex] };
}

console.log(getAvatarProps('p1'));
console.log(getAvatarProps('b1'));
console.log(getAvatarProps('b2'));
