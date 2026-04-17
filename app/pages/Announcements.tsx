import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../components/AuthContext';
import { UserNavbar } from '../components/UserNavbar';
import { Card, CardBody } from '../components/Card';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Calendar, Clock, Heart, MessageCircle, Send, Trash2 } from 'lucide-react';
import { motion } from 'motion/react';
import { toast } from 'sonner';
import { getApiUrl, getAssetUrl } from '../utils/apiConfig';

const getImageUrl = (image: string) => {
  if (!image) return null;
  return getAssetUrl(image);
};

type Comment = {
  id: number;
  announcementId: number;
  parentCommentId: number | null;
  user: string;
  userId: string;
  text: string;
  created_at: string;
  likeCount: number;
  likedByCurrentUser: boolean;
  children: Comment[];
};

export function Announcements() {
  const { user } = useAuth();
  const [commentTexts, setCommentTexts] = useState<Record<number, string>>({});
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedPost, setExpandedPost] = useState<number | null>(null);

  useEffect(() => {
    const fetchAnnouncements = async () => {
      setLoading(true);
      try {
        const query = user?.id ? `?user_id=${encodeURIComponent(user.id)}` : '';
        const response = await fetch(getApiUrl(`/api/announcements${query}`));
        if (!response.ok) throw new Error('Failed to load announcements');
        const data = await response.json();
        setPosts(
          data.map((post: any) => ({
            ...post,
            likes: post.likes ?? 0,
            commentCount: Number(post.commentCount ?? 0),
            comments: [],
            userLiked: Boolean(post.userLiked),
          }))
        );
      } catch (err) {
        setError((err as Error).message || 'Unable to load announcements');
      } finally {
        setLoading(false);
      }
    };

    fetchAnnouncements();
  }, [user?.id]);

  const updatePostComments = (postId: number, comments: Comment[]) => {
    setPosts((current) =>
      current.map((post) =>
        String(post.id) === String(postId) ? { ...post, comments } : post
      )
    );
  };

  const handleLike = async (postId: number) => {
    if (!user) {
      toast.error('You must be logged in to like announcements');
      return;
    }

    const post = posts.find((item) => String(item.id) === String(postId));
    const currentlyLiked = post?.userLiked;
    const method = currentlyLiked ? 'DELETE' : 'POST';
    const query = currentlyLiked ? `?user_id=${encodeURIComponent(user.id)}` : '';

    try {
      const response = await fetch(getApiUrl(`/api/announcements/${postId}/like${query}`), {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: currentlyLiked ? undefined : JSON.stringify({ userId: user.id }),
      });
      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || 'Failed to toggle like');
      }
      const data = await response.json();
      setPosts((current) =>
        current.map((item) =>
          String(item.id) === String(postId)
            ? { ...item, likes: data.likes ?? item.likes, userLiked: !currentlyLiked }
            : item
        )
      );
    } catch (error) {
      toast.error(`Unable to ${currentlyLiked ? 'unlike' : 'like'} post: ${(error as Error).message}`);
    }
  };

  const handleComment = async (postId: number) => {
    if (!user) {
      toast.error('You must be logged in to comment');
      return;
    }

    const commentText = (commentTexts[postId] || '').trim();
    if (!commentText) return;

    try {
      const response = await fetch(getApiUrl(`/api/announcements/${postId}/comments`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          user: user.name,
          text: commentText,
          parentCommentId: null,
        }),
      });
      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || 'Failed to post comment');
      }
      await fetchAnnouncementComments(postId);
      setCommentTexts((prev) => ({ ...prev, [postId]: '' }));
      toast.success('Comment posted');
    } catch (error) {
      toast.error(`Unable to post comment: ${(error as Error).message}`);
    }
  };

  const handleReply = async (postId: number, parentCommentId: number) => {
    if (!user) {
      toast.error('You must be logged in to reply');
      return;
    }

    const replyText = (commentTexts[parentCommentId] || '').trim();
    if (!replyText) return;

    try {
      const response = await fetch(getApiUrl(`/api/announcements/${postId}/comments`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          user: user.name,
          text: replyText,
          parentCommentId,
        }),
      });
      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || 'Failed to post reply');
      }
      await fetchAnnouncementComments(postId);
      setCommentTexts((prev) => ({ ...prev, [parentCommentId]: '' }));
      toast.success('Reply posted');
    } catch (error) {
      toast.error(`Unable to post reply: ${(error as Error).message}`);
    }
  };

  const updateCommentLike = (
    comment: Comment,
    commentId: number,
    likeCount: number,
    likedByCurrentUser: boolean
  ): Comment => {
    if (String(comment.id) === String(commentId)) {
      return { ...comment, likeCount, likedByCurrentUser };
    }
    return {
      ...comment,
      children: comment.children.map((child) =>
        updateCommentLike(child, commentId, likeCount, likedByCurrentUser)
      ),
    };
  };

  const handleCommentLike = async (postId: number, commentId: number, currentlyLiked: boolean) => {
    if (!user) {
      toast.error('You must be logged in to like comments');
      return;
    }

    const method = currentlyLiked ? 'DELETE' : 'POST';
    const query = currentlyLiked ? `?user_id=${encodeURIComponent(user.id)}` : '';

    try {
      const response = await fetch(getApiUrl(`/api/announcements/comments/${commentId}/like${query}`), {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: currentlyLiked ? undefined : JSON.stringify({ userId: user.id }),
      });
      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || 'Failed to toggle comment like');
      }
      const data = await response.json();
      setPosts((current) =>
        current.map((post) =>
          String(post.id) === String(postId)
            ? {
                ...post,
                comments: post.comments.map((comment: Comment) =>
                  updateCommentLike(comment, commentId, data.likeCount, !currentlyLiked)
                ),
              }
            : post
        )
      );
    } catch (error) {
      toast.error(`Unable to ${currentlyLiked ? 'unlike' : 'like'} comment: ${(error as Error).message}`);
    }
  };

  const handleDeleteComment = async (postId: number, commentId: number) => {
    if (!user) {
      toast.error('You must be logged in to delete comments');
      return;
    }

    if (!confirm('Are you sure you want to delete this comment?')) {
      return;
    }

    try {
      const response = await fetch(getApiUrl(`/api/announcements/${postId}/comments/${commentId}?user_id=${encodeURIComponent(user.id)}`), {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || 'Failed to delete comment');
      }
      await fetchAnnouncementComments(postId);
      toast.success('Comment deleted');
    } catch (error) {
      toast.error(`Unable to delete comment: ${(error as Error).message}`);
    }
  };

  const fetchAnnouncementComments = async (postId: number) => {
    try {
      const query = user?.id ? `?user_id=${encodeURIComponent(user.id)}` : '';
      const response = await fetch(getApiUrl(`/api/announcements/${postId}/comments${query}`));
      if (!response.ok) {
        throw new Error('Failed to load comments');
      }
      const data = await response.json();
      updatePostComments(postId, data.comments || []);
    } catch (error) {
      console.error('Failed to fetch comments:', error);
    }
  };

  const togglePostExpand = (postId: number) => {
    if (expandedPost === postId) {
      setExpandedPost(null);
      return;
    }

    const post = posts.find((item) => String(item.id) === String(postId));
    setExpandedPost(postId);
    if (post && (Array.isArray(post.comments) ? post.comments.length === 0 : true) && (post.commentCount ?? 0) > 0) {
      fetchAnnouncementComments(postId);
    }
  };

  const renderComment = (comment: Comment, postId: number, depth = 0) => (
    <div
      key={comment.id}
      className={`p-3 rounded-lg ${depth === 0 ? 'bg-secondary/30' : 'bg-background border border-border'} ${depth > 0 ? 'ml-6' : ''}`}
    >
      <div className="flex items-center justify-between mb-1">
        <span className="font-medium text-sm">{comment.user}</span>
        <span className="text-xs text-muted-foreground">{comment.created_at}</span>
      </div>
      <p className="text-sm text-muted-foreground mb-3">{comment.text}</p>
      <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground mb-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleCommentLike(postId, comment.id, Boolean(comment.likedByCurrentUser))}
          className="gap-1"
        >
          <Heart className={`w-4 h-4 ${comment.likedByCurrentUser ? 'text-destructive' : ''}`} />
          {comment.likeCount ?? 0}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setCommentTexts((prev) => ({ ...prev, [comment.id]: prev[comment.id] ?? '' }))}
          className="gap-1"
        >
          Reply
        </Button>
        {user?.id === comment.userId && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDeleteComment(postId, comment.id)}
            className="gap-1 text-destructive hover:text-destructive"
          >
            <Trash2 className="w-4 h-4" />
            Delete
          </Button>
        )}
      </div>
      <div className="flex gap-2 mb-3">
        <Input
          value={commentTexts[comment.id] ?? ''}
          onChange={(e) =>
            setCommentTexts((prev) => ({
              ...prev,
              [comment.id]: e.target.value,
            }))
          }
          placeholder="Write a reply..."
          className="flex-1"
        />
        <Button
          onClick={() => handleReply(postId, comment.id)}
          disabled={!(commentTexts[comment.id] || '').trim()}
        >
          Reply
        </Button>
      </div>
      {comment.children?.length > 0 && (
        <div className="space-y-3">
          {comment.children.map((child) => renderComment(child, postId, depth + 1))}
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen">
      <UserNavbar />

      <div className="max-w-4xl mx-auto p-6">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-primary mb-2">Announcements & Activities</h1>
          <p className="text-muted-foreground">Stay updated with parish news and events</p>
        </motion.div>

        <div className="space-y-6">
          {loading ? (
            <div className="text-center text-muted-foreground">Loading announcements...</div>
          ) : error ? (
            <div className="text-center text-destructive">{error}</div>
          ) : posts.length === 0 ? (
            <div className="text-center text-muted-foreground">No announcements found in the database.</div>
          ) : (
            posts.map((post, index) => (
              <motion.div
                key={post.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card>
                  {post.image && (
                    <div className="aspect-[2/1] overflow-hidden">
                      <img src={getImageUrl(post.image) || ''} alt={post.title} className="w-full h-full object-cover" />
                    </div>
                  )}
                  <CardBody>
                    <div className="flex items-center gap-2 mb-3">
                      <span
                        className={`px-3 py-1 rounded-full text-sm ${
                          post.type === 'announcement'
                            ? 'bg-primary/10 text-primary'
                            : 'bg-accent/10 text-accent'
                        }`}
                      >
                        {post.type === 'announcement' ? 'Announcement' : 'Activity'}
                      </span>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Calendar className="w-4 h-4" />
                        <span>{post.date}</span>
                      </div>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Clock className="w-4 h-4" />
                        <span>{post.time}</span>
                      </div>
                    </div>

                    <h2 className="mb-3">{post.title}</h2>
                    <p className="text-muted-foreground mb-4">{post.content}</p>

                    <div className="flex items-center gap-4 pb-4 border-b border-border">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleLike(post.id)}
                        className="gap-2"
                      >
                        <Heart className={`w-4 h-4 ${post.userLiked ? 'text-destructive' : ''}`} />
                        {post.likes ?? 0}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => togglePostExpand(post.id)}
                        className="gap-2"
                      >
                        <MessageCircle className="w-4 h-4" />
                        {post.comments?.length ?? post.commentCount ?? 0}
                      </Button>
                    </div>

                    {expandedPost === post.id && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-4"
                      >
                        {((post.comments?.length ?? 0) > 0 || (post.commentCount ?? 0) > 0) && (
                          <div className="space-y-3 mb-4">
                            {post.comments?.length > 0 ? (
                              post.comments.map((comment: Comment) => renderComment(comment, post.id))
                            ) : (
                              <div className="text-sm text-muted-foreground">
                                {post.commentCount ?? 0} comment(s) available. Loading...
                              </div>
                            )}
                          </div>
                        )}

                        <div className="flex gap-2">
                          <Input
                            value={commentTexts[post.id] ?? ''}
                            onChange={(e) =>
                              setCommentTexts((prev) => ({
                                ...prev,
                                [post.id]: e.target.value,
                              }))
                            }
                            placeholder="Write a comment..."
                            className="flex-1"
                          />
                          <Button
                            onClick={() => handleComment(post.id)}
                            disabled={!(commentTexts[post.id] || '').trim()}
                          >
                            <Send className="w-4 h-4" />
                          </Button>
                        </div>
                      </motion.div>
                    )}
                  </CardBody>
                </Card>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
