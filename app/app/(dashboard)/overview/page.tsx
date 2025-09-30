"use client";

import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dumbbell, Users, Calendar, TrendingUp } from "lucide-react";

const DashboardPage = () => {
  const { data: session } = useSession();

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-default-900">
            Welcome back, {session?.user?.name || 'User'}! 💪
          </h1>
          <p className="text-default-600 mt-2">
            Here&apos;s what&apos;s happening with your fitness journey today.
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-default-600">
              Total Workouts
            </CardTitle>
            <Dumbbell className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-default-900">24</div>
            <p className="text-xs text-green-600 mt-1">
              +12% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-default-600">
              Active Members
            </CardTitle>
            <Users className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-default-900">156</div>
            <p className="text-xs text-green-600 mt-1">
              +5 new this week
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-default-600">
              Classes This Week
            </CardTitle>
            <Calendar className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-default-900">18</div>
            <p className="text-xs text-blue-600 mt-1">
              3 more scheduled
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-default-600">
              Progress Score
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-default-900">94%</div>
            <p className="text-xs text-green-600 mt-1">
              +8% improvement
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-default-900">
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm text-default-600">
                  Completed upper body workout
                </span>
                <span className="text-xs text-default-400 ml-auto">2h ago</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span className="text-sm text-default-600">
                  New member Sarah joined
                </span>
                <span className="text-xs text-default-400 ml-auto">4h ago</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                <span className="text-sm text-default-600">
                  Yoga class completed
                </span>
                <span className="text-xs text-default-400 ml-auto">6h ago</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-default-900">
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <button className="w-full p-3 text-left bg-primary/10 hover:bg-primary/20 rounded-lg transition-colors">
                <div className="font-medium text-primary">Schedule New Class</div>
                <div className="text-sm text-default-600">Add a new fitness class</div>
              </button>
              <button className="w-full p-3 text-left bg-green-50 hover:bg-green-100 rounded-lg transition-colors">
                <div className="font-medium text-green-700">Add New Member</div>
                <div className="text-sm text-default-600">Register a new gym member</div>
              </button>
              <button className="w-full p-3 text-left bg-orange-50 hover:bg-orange-100 rounded-lg transition-colors">
                <div className="font-medium text-orange-700">Create Workout Plan</div>
                <div className="text-sm text-default-600">Design a custom workout routine</div>
              </button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* User Info Debug (Development Only) */}
      {process.env.NODE_ENV === 'development' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-default-900">
              Session Info (Development)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="text-sm bg-default-100 p-4 rounded-lg overflow-auto">
              {JSON.stringify(session, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default DashboardPage;