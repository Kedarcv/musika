import 'package:flutter/material.dart';
import 'package:flutter_webview_plugin/flutter_webview_plugin.dart'; // Updated import

void main() {
  runApp(MusikaApp());
}

class MusikaApp extends StatelessWidget {
  const MusikaApp({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Musika',
      theme: ThemeData(
        primarySwatch: Colors.green,
      ),
      home: WebviewScaffold( // Updated to use WebviewScaffold
        appBar: AppBar(
          title: Text('Musika'),
        ),
        url: 'index.html', // Load the index.html file
        withJavascript: true, // Enable JavaScript
      ),
    );
  }
}
