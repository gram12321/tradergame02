import { useState, useEffect } from 'react';
import { useLoadingState } from '@/hooks';
import { Button, Input, Label, Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter, Tabs, TabsContent, TabsList, TabsTrigger, Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '../ui';
import { User, Building2, Edit, Trash2 } from 'lucide-react';
import { authService, companyService } from '@/lib/services';
import { type AuthUser, type Company, supabase, updateUser, deleteUser } from '@/lib/database';
import { formatNumber, formatDate } from '@/lib/utils/utils';
import { AVATAR_OPTIONS } from '@/lib/utils/icons';
import { PageProps, CompanyProps } from '../../lib/types/UItypes';

// Color options
const COLOR_OPTIONS = [
  { id: 'blue', value: 'bg-blue-100 text-blue-800', label: 'Blue' },
  { id: 'green', value: 'bg-green-100 text-green-800', label: 'Green' },
  { id: 'red', value: 'bg-red-100 text-red-800', label: 'Red' },
  { id: 'purple', value: 'bg-purple-100 text-purple-800', label: 'Purple' },
  { id: 'yellow', value: 'bg-yellow-100 text-yellow-800', label: 'Yellow' },
  { id: 'pink', value: 'bg-pink-100 text-pink-800', label: 'Pink' },
  { id: 'indigo', value: 'bg-indigo-100 text-indigo-800', label: 'Indigo' },
  { id: 'gray', value: 'bg-gray-100 text-gray-800', label: 'Gray' }
];

interface ProfileProps extends PageProps, CompanyProps {
  onCompanySelected: (company: Company) => void;
  onBackToLogin: () => void;
}

export function Profile({ currentCompany, onCompanySelected, onBackToLogin }: ProfileProps) {
  // State
  const { isLoading, withLoading } = useLoadingState();
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [userCompany, setUserCompany] = useState<Company | null>(null);
  const [error, setError] = useState('');

  // Edit profile state
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editName, setEditName] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState('default');
  const [selectedColor, setSelectedColor] = useState('blue');


  useEffect(() => {
    // Listen for auth changes
    const unsubscribe = authService.onAuthStateChange((user) => {
      setCurrentUser(user);
      if (user) {
        loadUserData(user.id);
        setEditName(user.name);
        setSelectedAvatar(user.avatar || 'default');
        setSelectedColor(user.avatarColor || 'blue');
      } else {
        // If no authenticated user but there's a current company, show it
        if (currentCompany) {
          setUserCompany(currentCompany);
          // If the company has a user_id, try to load that user's information
          if (currentCompany.userId) {
            loadCompanyUserData(currentCompany.userId);
          }
        } else {
          setUserCompany(null);
        }
      }
    });

    return unsubscribe;
  }, [currentCompany]);

  const loadUserData = (userId: string) => withLoading(async () => {
    // 1:1 relationship - each user has exactly one company
    const company = await companyService.getUserCompany(userId);
    setUserCompany(company);
  });

  const loadCompanyUserData = async (userId: string) => {
    try {
      // Load user data from the database for companies with user_id
      const { data: user, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error loading company user data:', error);
        return;
      }

      if (user) {
        // Create a mock AuthUser object for display purposes
        const mockUser: AuthUser = {
          id: user.id,
          email: user.email,
          name: user.name,
          avatar: user.avatar,
          avatarColor: user.avatar_color,
          createdAt: new Date(user.created_at),
          updatedAt: new Date(user.updated_at)
        };
        
        setCurrentUser(mockUser);
        setEditName(user.name);
        setSelectedAvatar(user.avatar || 'default');
        setSelectedColor(user.avatar_color || 'blue');
        
        // Load all companies for this user
        await loadUserData(userId);
      }
    } catch (error) {
      console.error('Error loading company user data:', error);
    }
  };

  const handleUpdateProfile = () => withLoading(async () => {
    if (!currentUser) return;

    setError('');

    // Check if this is a company-linked user (not authenticated via Supabase)
    const isAuthenticatedUser = authService.isAuthenticated();
    
    let result;
    if (isAuthenticatedUser) {
      // Use authService for authenticated users
      result = await authService.updateProfile({
        name: editName.trim(),
        avatar: selectedAvatar,
        avatarColor: selectedColor
      });
    } else {
      // Use direct database update for company-linked users
      result = await updateUser(currentUser.id, {
        name: editName.trim(),
        avatar: selectedAvatar,
        avatar_color: selectedColor
      });
      
      // Reload the user data after update
      if (result.success) {
        await loadCompanyUserData(currentUser.id);
      }
    }

    if (result.success) {
      setIsEditDialogOpen(false);
    } else {
      setError(result.error || 'Failed to update profile');
    }
  });

  const handleSelectCompany = (company: Company) => withLoading(async () => {
    // Update the company's last played time
    await companyService.updateCompany(company.id, {});
    
    onCompanySelected(company);
  });

  const handleDeleteAccount = () => withLoading(async () => {
    if (!currentUser) return;
    
    if (confirm('Are you sure you want to permanently delete your account? This will delete all your companies and cannot be undone.')) {
      // Check if this is a company-linked user (not authenticated via Supabase)
      const isAuthenticatedUser = authService.isAuthenticated();
      
      let result;
      if (isAuthenticatedUser) {
        // Use authService for authenticated users
        result = await authService.deleteAccount();
      } else {
        // Use direct database deletion for company-linked users
        result = await deleteUser(currentUser.id);
      }
      
      if (result.success) {
        onBackToLogin();
      } else {
        setError(result.error || 'Failed to delete account');
      }
    }
  });


  const getColorClass = (colorId: string) => {
    return COLOR_OPTIONS.find(c => c.id === colorId)?.value || COLOR_OPTIONS[0].value;
  };


  if (!currentUser && !currentCompany) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              No User Profile
            </CardTitle>
            <CardDescription>
              You need to be signed in to view your profile
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={onBackToLogin} className="w-full">
              Back to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const avatarEmoji = AVATAR_OPTIONS.find(a => a.id === selectedAvatar)?.emoji || '👤';
  const colorClass = getColorClass(currentUser?.avatarColor || 'blue');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
            <User className="h-6 w-6" />
            Player Profile
          </h2>
          <p className="text-muted-foreground">Manage your profile and companies</p>
        </div>
        <Button variant="outline" onClick={onBackToLogin}>
          Back to Login
        </Button>
      </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profile Information */}
          <div className="space-y-6">
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle>Profile</CardTitle>
                  <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Edit className="w-4 h-4 mr-1" />
                        Edit
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[500px]">
                      <DialogHeader>
                        <DialogTitle>Edit Profile</DialogTitle>
                        <DialogDescription>
                          Customize your profile information and avatar
                        </DialogDescription>
                      </DialogHeader>
                      <Tabs defaultValue="basic">
                        <TabsList className="grid w-full grid-cols-2">
                          <TabsTrigger value="basic">Basic Info</TabsTrigger>
                          <TabsTrigger value="avatar">Avatar</TabsTrigger>
                        </TabsList>
                        
                        <TabsContent value="basic" className="space-y-4">
                          <div>
                            <Label htmlFor="editName">Name</Label>
                            <Input
                              id="editName"
                              value={editName}
                              onChange={(e) => setEditName(e.target.value)}
                            />
                          </div>
                        </TabsContent>
                        
                        <TabsContent value="avatar" className="space-y-4">
                          <div>
                            <Label className="text-sm font-medium">Avatar</Label>
                            <div className="grid grid-cols-4 gap-2 mt-2">
                              {AVATAR_OPTIONS.map((avatar) => (
                                <div
                                  key={avatar.id}
                                  className={`p-3 border rounded-md flex items-center justify-center cursor-pointer text-2xl transition-all ${
                                    selectedAvatar === avatar.id ? 'border-primary bg-primary/10' : 'hover:bg-accent'
                                  }`}
                                  onClick={() => setSelectedAvatar(avatar.id)}
                                >
                                  {avatar.emoji}
                                </div>
                              ))}
                            </div>
                          </div>
                          
                          <div>
                            <Label className="text-sm font-medium">Color</Label>
                            <div className="grid grid-cols-4 gap-2 mt-2">
                              {COLOR_OPTIONS.map((color) => (
                                <div
                                  key={color.id}
                                  className={`${color.value} h-8 rounded-md border cursor-pointer flex items-center justify-center text-xs font-medium ${
                                    selectedColor === color.id ? 'ring-2 ring-primary' : ''
                                  }`}
                                  onClick={() => setSelectedColor(color.id)}
                                >
                                  {color.label}
                                </div>
                              ))}
                            </div>
                          </div>
                          
                          <div className="pt-4 border-t">
                            <Label className="text-sm font-medium">Preview</Label>
                            <div className="flex justify-center mt-2">
                              <div className={`w-16 h-16 ${getColorClass(selectedColor)} rounded-full flex items-center justify-center`}>
                                <span className="text-2xl">
                                  {AVATAR_OPTIONS.find(a => a.id === selectedAvatar)?.emoji}
                                </span>
                              </div>
                            </div>
                          </div>
                        </TabsContent>
                      </Tabs>
                      
                      {error && (
                        <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
                          {error}
                        </div>
                      )}
                      
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                          Cancel
                        </Button>
                        <Button onClick={handleUpdateProfile} disabled={isLoading}>
                          {isLoading ? 'Saving...' : 'Save Changes'}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent className="flex flex-col items-center pt-2">
                <div className={`w-24 h-24 ${colorClass} rounded-full flex items-center justify-center mb-4`}>
                  <span className="text-4xl">{avatarEmoji}</span>
                </div>
                <h2 className="text-xl font-semibold">{currentUser?.name || 'Anonymous User'}</h2>
                <p className="text-sm text-muted-foreground">
                  {currentUser ? `Member since ${formatDate(currentUser.createdAt)}` : 'Playing as guest'}
                </p>
                {currentUser && (
                  <div className="mt-4 w-full space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Email:</span>
                      <span className="truncate ml-2">{currentUser.email || 'Not provided'}</span>
                    </div>
                  </div>
                )}
              </CardContent>
              {currentUser && (
                <CardFooter className="pt-0">
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleDeleteAccount}
                    className="w-full"
                    disabled={isLoading}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete Account
                  </Button>
                </CardFooter>
              )}
            </Card>

            {/* Company Info */}
            {userCompany && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="h-5 w-5" />
                    Your Company
                  </CardTitle>
                  <CardDescription>Company information (1:1 relationship)</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-muted-foreground">Company Name</p>
                      <p className="text-lg font-semibold">{userCompany.name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Money</p>
                      <p className="text-lg font-semibold">{formatNumber(userCompany.money, { currency: true, decimals: 0 })}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Game Date</p>
                      <p className="text-lg font-semibold">Day {userCompany.currentDay}, Month {userCompany.currentMonth}, {userCompany.currentYear}</p>
                    </div>
                    {userCompany.id !== currentCompany?.id && (
                      <Button 
                        onClick={() => handleSelectCompany(userCompany)}
                        className="w-full"
                      >
                        Switch to This Company
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
    </div>
  );
}