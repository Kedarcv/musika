class Order {
  String id;
  String userId;
  String restaurantId;
  List<String> items;
  String status;

  Order({required this.id, required this.userId, required this.restaurantId, required this.items, required this.status});
}
