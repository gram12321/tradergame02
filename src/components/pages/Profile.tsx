import { useState, useEffect } from 'react';
import { useLoadingState } from '@/hooks';
import { Button, Input, Label, Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter, Tabs, TabsContent, TabsList, TabsTrigger, Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '../ui';
import { Building2, Edit, Trash2 } from 'lucide-react';
import { companyService } from '@/lib/services';
import { type Company } from '@/lib/database';
import { formatNumber } from '@/lib/utils/utils';
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
  const [company, setCompany] = useState<Company | null>(currentCompany || null);
  const [error, setError] = useState('');

  // Edit profile state
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editName, setEditName] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState('default');
  const [selectedColor, setSelectedColor] = useState('blue');

  useEffect(() => {
    if (currentCompany) {
      setCompany(currentCompany);
      setEditName(currentCompany.name);
      setSelectedAvatar(currentCompany.avatar || 'default');
      setSelectedColor(currentCompany.avatarColor || 'blue');
    } else {
      setCompany(null);
    }
  }, [currentCompany]);

  const handleUpdateProfile = () => withLoading(async () => {
    if (!company) return;

    setError('');

    const result = await companyService.updateCompany(company.name, {
      name: editName.trim(),
      avatar: selectedAvatar,
      avatarColor: selectedColor
    });

    if (result.success) {
      // Reload company data (use new name if it changed, otherwise use current name)
      const companyNameToLoad = editName.trim() !== company.name ? editName.trim() : company.name;
      const updatedCompany = await companyService.getCompany(companyNameToLoad);
      if (updatedCompany) {
        setCompany(updatedCompany);
        if (onCompanySelected) {
          onCompanySelected(updatedCompany);
        }
      }
      setIsEditDialogOpen(false);
    } else {
      setError(result.error || 'Failed to update profile');
    }
  });

  const handleDeleteCompany = () => withLoading(async () => {
    if (!company) return;
    
    if (confirm('Are you sure you want to permanently delete this company? This action cannot be undone.')) {
      const result = await companyService.deleteCompany(company.name);
      
      if (result.success) {
        onBackToLogin();
      } else {
        setError(result.error || 'Failed to delete company');
      }
    }
  });


  const getColorClass = (colorId: string) => {
    return COLOR_OPTIONS.find(c => c.id === colorId)?.value || COLOR_OPTIONS[0].value;
  };


  if (!company) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              No Company Selected
            </CardTitle>
            <CardDescription>
              Please select a company to view its profile
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
  const colorClass = getColorClass(company?.avatarColor || 'blue');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
            <Building2 className="h-6 w-6" />
            Company Profile
          </h2>
          <p className="text-muted-foreground">Manage your company profile and information</p>
        </div>
        <Button variant="outline" onClick={onBackToLogin}>
          Back to Login
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Company Profile Information */}
        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle>Company Profile</CardTitle>
                <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Edit className="w-4 h-4 mr-1" />
                      Edit
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                      <DialogTitle>Edit Company Profile</DialogTitle>
                      <DialogDescription>
                        Customize your company information and avatar
                      </DialogDescription>
                    </DialogHeader>
                    <Tabs defaultValue="basic">
                      <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="basic">Basic Info</TabsTrigger>
                        <TabsTrigger value="avatar">Avatar</TabsTrigger>
                      </TabsList>
                      
                      <TabsContent value="basic" className="space-y-4">
                        <div>
                          <Label htmlFor="editName">Company Name</Label>
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
              <h2 className="text-xl font-semibold">{company?.name || 'Unnamed Company'}</h2>
            </CardContent>
            {company && (
              <CardFooter className="pt-0">
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleDeleteCompany}
                  className="w-full"
                  disabled={isLoading}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Company
                </Button>
              </CardFooter>
            )}
          </Card>

          {/* Company Information */}
          {company && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Company Details
                </CardTitle>
                <CardDescription>Company game information</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-muted-foreground">Company Name</p>
                    <p className="text-lg font-semibold">{company.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Money</p>
                    <p className="text-lg font-semibold">{formatNumber(company.money, { currency: true, decimals: 0 })}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Game Date</p>
                    <p className="text-lg font-semibold">Day {company.currentDay}, Month {company.currentMonth}, {company.currentYear}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}