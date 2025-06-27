import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  FlatList, 
  StyleSheet, 
  Alert,
  ActivityIndicator,
  RefreshControl,
  KeyboardAvoidingView,
  Platform,
  ScrollView
} from 'react-native';
import { auth, firestore } from '../firebaseConfig';
import { collection, addDoc, getDocs, query, orderBy, onSnapshot, Timestamp, getCountFromServer } from 'firebase/firestore';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

type RootStackParamList = {
  PostDetail: { post: Post };
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'PostDetail'>;

interface Comment {
  id: string;
  text: string;
  createdAt: Timestamp;
  userId: string;
}

interface Post {
  id: string;
  title: string;
  description: string;
  createdAt: Timestamp;
  userId: string;
  userName: string;
  commentCount?: number;
}

const Forum = () => {
  const navigation = useNavigation<NavigationProp>();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCreatePost = async () => {
    if (title.trim() === '' || description.trim() === '') {
      Alert.alert('Erro', 'O título e a descrição são obrigatórios');
      return;
    }

    const user = auth.currentUser;
    if (!user) {
      Alert.alert('Erro', 'Você precisa estar com o login feito para criar uma publicação');
      return;
    }

    setIsSubmitting(true);
    const post = {
      title,
      description,
      createdAt: Timestamp.now(),
      userId: user.uid,
      userName: user.displayName || 'Utilizador',
      commentCount: 0
    };

    try {
      const postsRef = collection(firestore, 'posts');
      const docRef = await addDoc(postsRef, post);
      console.log('Post salvo com sucesso! ID:', docRef.id);
      setTitle('');
      setDescription('');
      Alert.alert('Sucesso', 'Publicação criada com sucesso');
    } catch (error: any) {
      console.error('Erro ao salvar o post:', error);
      Alert.alert('Erro', 'Falha ao criar a publicação: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const fetchPosts = () => {
    console.log('Iniciando busca de posts...');
    setLoading(true);
    const postsRef = collection(firestore, 'posts');
    const q = query(postsRef, orderBy('createdAt', 'desc'));
    
    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const postsData = await Promise.all(
        snapshot.docs.map(async (doc) => {
          const postData = doc.data() as Post;
          const commentsRef = collection(firestore, `posts/${doc.id}/comments`);
          const commentsSnapshot = await getCountFromServer(commentsRef);
          return {
            ...postData,
            id: doc.id,
            commentCount: commentsSnapshot.data().count
          };
        })
      );
      
      console.log('Posts processados:', postsData.length);
      setPosts(postsData);
      setLoading(false);
      setRefreshing(false);
    }, (error) => {
      console.error('Erro ao buscar posts:', error);
      Alert.alert('Erro', 'Falha ao carregar as publicações: ' + error.message);
      setLoading(false);
      setRefreshing(false);
    });

    return unsubscribe;
  };

  const onRefresh = () => {
    console.log('Atualizando posts...');
    setRefreshing(true);
    fetchPosts();
  };

  useEffect(() => {
    console.log('Componente montado, a procura de  posts...');
    const unsubscribe = fetchPosts();

    return () => {
      console.log('Componente desmontado, limpando listeners...');
      unsubscribe();
    };
  }, []);

  const handlePostPress = (post: Post) => {
    navigation.navigate('PostDetail', { post });
  };

  const renderPost = ({ item }: { item: Post }) => (
    <TouchableOpacity 
      style={styles.postItem}
      onPress={() => handlePostPress(item)}
    >
      <View style={styles.postHeader}>
        <Text style={styles.postTitle}>{item.title}</Text>
        <Text style={styles.postDate}>
          {item.createdAt.toDate().toLocaleString('pt-PT', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            timeZone: 'Europe/Lisbon'
          })}
        </Text>
      </View>
      <Text style={styles.postDescription} numberOfLines={2}>
        {item.description}
      </Text>
      <View style={styles.postFooter}>
        <View style={styles.commentCount}>
          <Ionicons name="chatbubble-outline" size={16} color="#666" />
          <Text style={styles.commentCountText}>
            {item.commentCount || 0} comentários
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderEmptyList = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="chatbubble-outline" size={64} color="#ccc" />
      <Text style={styles.emptyText}>Nenhuma publicação ainda</Text>
      <Text style={styles.emptySubText}>Seja o primeiro a compartilhar!</Text>
    </View>
  );

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
    >
      <ScrollView style={styles.formContainer}>
        <Text style={styles.title}>Fórum de Plantas</Text>
        <Text style={styles.subtitle}>Partilhe as  suas experiências e dúvidas</Text>

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Título"
            value={title}
            onChangeText={setTitle}
            placeholderTextColor="#666"
          />
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Descrição"
            value={description}
            onChangeText={setDescription}
            multiline
            placeholderTextColor="#666"
          />
          <TouchableOpacity 
            style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
            onPress={handleCreatePost}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.submitButtonText}>Criar Publicação</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>

      <View style={styles.postsContainer}>
        {loading && !refreshing ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#4CAF50" />
          </View>
        ) : (
          <FlatList
            data={posts}
            renderItem={renderPost}
            keyExtractor={(item) => item.id}
            style={styles.postList}
            contentContainerStyle={styles.postListContent}
            ListEmptyComponent={renderEmptyList}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={['#4CAF50']}
                tintColor="#4CAF50"
              />
            }
          />
        )}
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  formContainer: {
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2E7D32',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
  },
  inputContainer: {
    marginBottom: 20,
  },
  input: {
    backgroundColor: '#f9f9f9',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    fontSize: 16,
    color: '#333',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  submitButton: {
    backgroundColor: '#4CAF50',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  submitButtonDisabled: {
    backgroundColor: '#A5D6A7',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  postsContainer: {
    flex: 1,
  },
  postList: {
    flex: 1,
  },
  postListContent: {
    padding: 16,
  },
  postItem: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  postHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  postTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2E7D32',
    flex: 1,
    marginRight: 8,
  },
  postDate: {
    fontSize: 12,
    color: '#666',
  },
  postDescription: {
    fontSize: 16,
    color: '#333',
    lineHeight: 22,
  },
  postFooter: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  commentCount: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  commentCountText: {
    marginLeft: 4,
    fontSize: 14,
    color: '#666',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 18,
    color: '#666',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubText: {
    fontSize: 14,
    color: '#999',
  },
});

export default Forum;
