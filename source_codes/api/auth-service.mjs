/**
 * For auth strategy is used library passport and passport-jwt, this is used as middleware in 
 */


import passport from 'passport'
import { Strategy as JWTStrategy, ExtractJwt } from 'passport-jwt'
import config from '../../config.mjs'

// Database models defined by sequelize
import sequelize from '../sequelize/index.mjs'

const { User, Role } = sequelize.models

const jwtConf = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: config.get('JWT_SECRET'),
  session: false,
}

const strategy = new JWTStrategy(jwtConf, async (jwtPayLoad, cb) => {
  try {
    const user = await User.findByPk(jwtPayLoad.id, {
      include: [
        {
          model: Role,
          as: 'roles',
        },
      ],
    })

    if (user === null || user.flag_active !== 1) {
      throw {
        status: 401,
        statusText: 'User not found or activated',
      }
    }

    user.isAdmin = user.roles.findIndex(item => item.alias === 'admin') >= 0
    user.isAccountant = user.roles.findIndex(item => item.alias === 'accountant') >= 0
    user.isSupervisor = user.roles.findIndex(item => item.alias === 'supervisor') >= 0
    user.isAnnotator = user.roles.findIndex(item => item.alias === 'annotator') >= 0

    cb(null, user)
  } catch (err) {
    cb(err)
  }
})

passport.use(strategy)

export const jwtStrategy = passport.authenticate('jwt', {
  session: false,
})
