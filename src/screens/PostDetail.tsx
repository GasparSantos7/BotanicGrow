import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { auth, firestore } from '../firebaseConfig';
import { collection, addDoc, query, orderBy, onSnapshot, Timestamp, doc, updateDoc, increment } from 'firebase/firestore';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

type RootStackParamList = {
  PostDetail: { post: Post };
};

type PostDetailScreenRouteProp = RouteProp<RootStackParamList, 'PostDetail'>;
type PostDetailScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'PostDetail'>;

interface Props {
  route: PostDetailScreenRouteProp;
  navigation: PostDetailScreenNavigationProp;
}

interface Comment {
  id: string;
  text: string;
  createdAt: Timestamp;
  userId: string;
  userName: string;
}

interface Post {
  id: string;
  title: string;
  description: string;
  createdAt: Timestamp;
  userId: string;
  userName: string;
  comments?: Comment[];
}

const PostDetail = ({ route, navigation }: Props) => {
  const { post } = route.params;
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    navigation.setOptions({
      title: 'Detalhes do Post',
      headerTitleStyle: {
        color: '#2E7D32',
      },
    });

    const commentsRef = collection(firestore, `posts/${post.id}/comments`);
    const q = query(commentsRef, orderBy('createdAt', 'desc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const commentsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Comment[];
      setComments(commentsData);
      setLoading(false);
    });

    return () => {
      unsubscribe();
    };
  }, [post.id]);

  const handleAddComment = async () => {
    if (!newComment.trim()) {
      Alert.alert('Erro', 'O comentário não pode estar vazio');
      return;
    }

    const user = auth.currentUser;
    if (!user) {
      Alert.alert('Erro', 'Você precisa estar com o login feito para comentar');
      return;
    }

    setSubmitting(true);
    const comment = {
      text: newComment.trim(),
      createdAt: Timestamp.now(),
      userId: user.uid,
      userName: user.displayName || 'Usuário'
    };

    try {
      const commentsRef = collection(firestore, `posts/${post.id}/comments`);
      await addDoc(commentsRef, comment);
      
      // Update the post's comment count
      const postRef = doc(firestore, 'posts', post.id);
      await updateDoc(postRef, {
        commentCount: increment(1)
      });

      setNewComment('');
      Alert.alert('Sucesso', 'Comentário adicionado com sucesso');
    } catch (error: any) {
      console.error('Erro ao adicionar comentário:', error);
      // Removido o Alert de erro ao adicionar comentário
    } finally {
      setSubmitting(false);
    }
  };

  const renderComment = (comment: Comment) => (
    <View key={comment.id} style={styles.commentItem}>
      <View style={styles.commentHeader}>
        <Text style={styles.commentAuthor}>{comment.userName}</Text>
        <Text style={styles.commentDate}>
          {comment.createdAt.toDate().toLocaleString('pt-PT', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            timeZone: 'Europe/Lisbon'
          })}
        </Text>
      </View>
      <Text style={styles.commentText}>{comment.text}</Text>
    </View>
  );

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
    >
      <ScrollView style={styles.content}>
        <View style={styles.postContainer}>
          <Text style={styles.postTitle}>{post.title}</Text>
          <Text style={styles.postDate}>
            {post.createdAt.toDate().toLocaleString('pt-PT', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
              timeZone: 'Europe/Lisbon'
            })}
          </Text>
          <Text style={styles.postDescription}>{post.description}</Text>
        </View>

        <View style={styles.commentsSection}>
          <Text style={styles.commentsTitle}>Comentários</Text>
          {loading ? (
            <ActivityIndicator size="large" color="#4CAF50" />
          ) : comments.length > 0 ? (
            comments.map(renderComment)
          ) : (
            <Text style={styles.noComments}>Nenhum comentário ainda. Seja o primeiro a comentar!</Text>
          )}
        </View>
      </ScrollView>

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Adicione um comentário..."
          value={newComment}
          onChangeText={setNewComment}
          multiline
          placeholderTextColor="#666"
        />
        <TouchableOpacity
          style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
          onPress={handleAddComment}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Ionicons name="send" size={24} color="#fff" />
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    flex: 1,
  },
  postContainer: {
    backgroundColor: '#fff',
    padding: 16,
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  postTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2E7D32',
    marginBottom: 8,
  },
  postDate: {
    fontSize: 12,
    color: '#666',
    marginBottom: 12,
  },
  postDescription: {
    fontSize: 16,
    color: '#333',
    lineHeight: 24,
  },
  commentsSection: {
    padding: 16,
  },
  commentsTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#2E7D32',
    marginBottom: 16,
  },
  commentItem: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  commentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  commentAuthor: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2E7D32',
  },
  commentDate: {
    fontSize: 12,
    color: '#666',
  },
  commentText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  noComments: {
    textAlign: 'center',
    color: '#666',
    fontSize: 16,
    marginTop: 20,
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    backgroundColor: '#f9f9f9',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    fontSize: 16,
    maxHeight: 100,
  },
  submitButton: {
    backgroundColor: '#4CAF50',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: '#A5D6A7',
  },
});

export default PostDetail; 