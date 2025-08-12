// getCourseGradient.js
function getCourseGradient(index) {
  const gradients = [
    "linear-gradient(135deg, #4D96FF 65%, #6BCB77 100%)",
    "linear-gradient(135deg, #FF6B6B 60%, #FFD93D 100%)",
    "linear-gradient(135deg, #845EC2 60%, #00C9A7 100%)",
    "linear-gradient(135deg, #C34A36 65%, #FFD93D 100%)",
    "linear-gradient(135deg, #2563eb 60%, #93c5fd 100%)",
    "linear-gradient(135deg, #00A8E8 60%, #F76C6C 100%)",
  ];
  return gradients[index % gradients.length];
}
export default getCourseGradient;
