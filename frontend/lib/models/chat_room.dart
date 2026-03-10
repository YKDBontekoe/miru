class ChatRoom {
  final String id;
  final String name;
  final String createdAt;

  ChatRoom({required this.id, required this.name, required this.createdAt});

  factory ChatRoom.fromJson(Map<String, dynamic> json) {
    return ChatRoom(
      id: json['id'].toString(),
      name: json['name'].toString(),
      createdAt: json['created_at'].toString(),
    );
  }

  Map<String, dynamic> toJson() {
    return {'id': id, 'name': name, 'created_at': createdAt};
  }
}
