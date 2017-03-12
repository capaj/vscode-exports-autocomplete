import React, {
  Component
} from 'react'
import {
  observer
} from 'mobx-react'
import ProfileImage from './profile-image'
import {
  observable
} from 'mobx'
import InlineInput from './inline-input'
import ImageUploader from './image-uploader'
import BoundInput from './bound-input'
import CategorySelect from './category-select'
import TargetSelect from './target-select'
import createTask from '../graphql/create-task'
import {
  browserHistory
} from 'react-router'
import {
  Card,
  CardContent,
  Columns,
  Column,
  Addons,
  CardFooter,
  Button
} from './bulma/index'

console.log(1)
